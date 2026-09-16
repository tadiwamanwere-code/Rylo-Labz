/* The assistant that sits in the corner of every page. It is a thin shell:
   the answers come from /api/chat, which talks to Claude. Nothing is stored
   on a server. The conversation lives in this tab only. */
(function () {
  'use strict';

  var GREETING = 'Hi. I am the Rylo Labz assistant. Ask me about prices, what we build, or UtahOp.';
  var CHIPS = ['What does a website cost?', 'What is UtahOp?', 'How long does it take?'];

  var history = [];
  var busy = false;
  var root, panel, list, form, input, sendBtn, launcher, chipRow;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function scrollDown() {
    list.scrollTop = list.scrollHeight;
  }

  // Turns the reply into paragraphs and simple bullets, and makes bare links
  // and the WhatsApp number clickable. Everything is added as text, never as
  // HTML, so a reply cannot inject markup into the page.
  function render(text, bubble) {
    String(text).split(/\n+/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var isBullet = /^[-*•]\s+/.test(line);
      var p = el('p', isBullet ? 'ra-bullet' : null);
      if (isBullet) line = line.replace(/^[-*•]\s+/, '');
      var pattern = /(https?:\/\/[^\s)]+|rylolabz\.com\/[a-z-]+|yuta-opp\.vercel\.app\/login|\+263\s?71\s?507\s?9192|wil@rylolabz\.com)/g;
      var last = 0;
      var match;
      while ((match = pattern.exec(line)) !== null) {
        if (match.index > last) p.appendChild(document.createTextNode(line.slice(last, match.index)));
        var raw = match[0];
        var a = el('a', null, raw.replace(/[.,]$/, ''));
        if (raw.indexOf('@') > -1) a.href = 'mailto:' + raw;
        else if (raw.indexOf('+263') > -1) a.href = 'https://wa.me/263715079192';
        else a.href = raw.indexOf('http') === 0 ? raw : 'https://' + raw;
        if (a.href.indexOf('rylolabz.com') === -1) { a.target = '_blank'; a.rel = 'noopener'; }
        p.appendChild(a);
        last = match.index + raw.length;
      }
      if (last < line.length) p.appendChild(document.createTextNode(line.slice(last)));
      bubble.appendChild(p);
    });
  }

  function addMessage(role, text) {
    var row = el('div', 'ra-msg ra-msg--' + role);
    var bubble = el('div', 'ra-bubble');
    render(text, bubble);
    row.appendChild(bubble);
    list.appendChild(row);
    scrollDown();
    return row;
  }

  function addThinking() {
    var row = el('div', 'ra-msg ra-msg--assistant ra-thinking');
    var bubble = el('div', 'ra-bubble');
    bubble.appendChild(el('i'));
    bubble.appendChild(el('i'));
    bubble.appendChild(el('i'));
    row.appendChild(bubble);
    list.appendChild(row);
    scrollDown();
    return row;
  }

  function setBusy(state) {
    busy = state;
    sendBtn.disabled = state;
    input.disabled = state;
  }

  async function ask(text) {
    if (busy || !text) return;
    if (chipRow) { chipRow.remove(); chipRow = null; }

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    setBusy(true);
    var thinking = addThinking();

    try {
      var response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var data = await response.json().catch(function () { return {}; });
      thinking.remove();

      if (!response.ok || !data.reply) {
        addMessage('assistant', data.error || 'Something went wrong. Message us on WhatsApp on +263 71 507 9192.');
      } else {
        addMessage('assistant', data.reply);
        history.push({ role: 'assistant', content: data.reply });
      }
    } catch (err) {
      thinking.remove();
      addMessage('assistant', 'I could not reach the server. Message us on WhatsApp on +263 71 507 9192.');
    }

    setBusy(false);
    input.focus();
  }

  function openPanel() {
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('inert');
    setTimeout(function () { input.focus(); }, 260);
    if (typeof window.uopTrack === 'function') window.uopTrack('opened_assistant');
  }

  function closePanel() {
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('inert', '');
    launcher.focus();
  }

  function build() {
    root = el('div', 'ra');
    root.setAttribute('data-assistant', '');

    launcher = el('button', 'ra-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Ask the Rylo Labz assistant');
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.2-.6L3 21l1.8-5.1A8.3 8.3 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>' +
      '</svg><span>Ask us</span>';

    panel = el('div', 'ra-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Rylo Labz assistant');
    panel.setAttribute('inert', '');

    var head = el('div', 'ra-head');
    var who = el('div', 'ra-who');
    who.appendChild(el('b', null, 'Rylo Labz assistant'));
    who.appendChild(el('span', null, 'Answers about prices, websites and UtahOp'));
    var close = el('button', 'ra-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    head.appendChild(who);
    head.appendChild(close);

    list = el('div', 'ra-list');
    form = el('form', 'ra-form');
    input = el('input', 'ra-input');
    input.type = 'text';
    input.placeholder = 'Ask a question';
    input.setAttribute('aria-label', 'Your question');
    input.autocomplete = 'off';
    sendBtn = el('button', 'ra-send');
    sendBtn.type = 'submit';
    sendBtn.setAttribute('aria-label', 'Send');
    sendBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    form.appendChild(input);
    form.appendChild(sendBtn);

    var note = el('p', 'ra-note');
    note.appendChild(document.createTextNode('This is an AI. It can get things wrong. For anything important, '));
    var waLink = el('a', null, 'message a human');
    waLink.href = 'https://wa.me/263715079192';
    waLink.target = '_blank';
    waLink.rel = 'noopener';
    note.appendChild(waLink);
    note.appendChild(document.createTextNode('.'));

    panel.appendChild(head);
    panel.appendChild(list);
    panel.appendChild(form);
    panel.appendChild(note);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    addMessage('assistant', GREETING);
    chipRow = el('div', 'ra-chips');
    CHIPS.forEach(function (text) {
      var chip = el('button', 'ra-chip', text);
      chip.type = 'button';
      chip.addEventListener('click', function () { ask(text); });
      chipRow.appendChild(chip);
    });
    list.appendChild(chipRow);

    launcher.addEventListener('click', function () {
      root.classList.contains('is-open') ? closePanel() : openPanel();
    });
    close.addEventListener('click', closePanel);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value.trim());
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) closePanel();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
