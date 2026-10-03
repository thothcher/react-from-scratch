// 04 · UI = f(state), naively: every update builds a brand-new tree and replaces the whole DOM.
(function () {
  const { icons } = RS;

  RS.chapters.push({
    id: 'state',
    short: 'state',
    kicker: '04 · STATE',
    title: 'UI = f(state) — გულუბრყვილოდ',
    tocTitle: 'UI = f(state), გულუბრყვილოდ',
    lead: 'state შეიცვალა → <span class="mono">App()</span> ახალ ხეს აბრუნებს → ძველ DOM-ს ვშლით და ახალს ვაწყობთ. იდეა მშვენიერია: ეკრანი ყოველთვის state-ის ფუნქციაა და ხელით DOM-ს აღარ ვეხებით. მაგრამ ფაქტობრივად ეს ისევ <span class="mono">innerHTML</span>-ია — და პრობლემებიც იგივეა.',
    tryit: [
      'დააჭირეთ <b>Add</b>-ს: ხეში ყველა რიგი წითელია — ყოველი კვანძი ახალია.',
      'ძიების ველში აკრიფეთ რამე — focus ისევ იკარგება.',
      'გადახედეთ <span class="mono">app.jsx</span>-ს: აპის კოდი უკვე React-ისნაირია. გამოსასწორებელი <b>ძრავია</b>.',
    ],
    code: [
      { label: 'mini-react.js', lib: 4 },
      { label: 'app.jsx', source: 'app-global' },
    ],
    lab: {
      title: 'Trattoria — mini-react v0.4',
      controls: `<button class="btn" data-reset>${icons.reset}თავიდან</button>`,
      html: () => RS.appLabHTML({ tree: true }),
      mount(el) {
        const lab = RS.appLab(el, { version: 4, source: RS.source('app-global') });
        el.querySelector('[data-reset]').addEventListener('click', () => lab.remount());
        return () => lab.destroy();
      },
    },
  });
})();
