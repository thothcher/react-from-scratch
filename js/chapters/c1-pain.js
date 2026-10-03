// 01 · The pain: our vanilla restaurant re-renders with innerHTML. Measured, not described.
(function () {
  const { icons } = RS;

  /** "Guess first" panel used in chapters 1 and 5. */
  RS.predictHTML = ({ question, options, note }) => `
    <section class="panel al-side">
      <header class="panel-h"><span>ჯერ გამოიცანით</span></header>
      <div class="predict">
        <p class="predict-q">${question}</p>
        <div class="predict-opts">${options.map(([v, label]) => `<button data-guess="${v}">${label}</button>`).join('')}</div>
        <p class="predict-hint" data-hint>აირჩიეთ პასუხი, შემდეგ დააჭირეთ <b>Add</b>-ს.</p>
        <p class="predict-res" data-res hidden></p>
      </div>
      ${note ? `<p class="side-note">${note}</p>` : ''}
    </section>`;

  RS.predict = function predict(el) {
    let guess = null;
    let label = '';
    let armed = false;
    const res = el.querySelector('[data-res]');
    const hint = el.querySelector('[data-hint]');
    el.querySelectorAll('[data-guess]').forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll('[data-guess]').forEach((x) => x.classList.toggle('is-picked', x === b));
      guess = Number(b.dataset.guess);
      label = b.textContent;
      armed = true;
      res.hidden = true;
      hint.hidden = false;
    }));
    return {
      /** Call with the summary of an update caused by an "Add" click. */
      resolve(total) {
        if (!armed) return;
        armed = false;
        hint.hidden = true;
        res.hidden = false;
        const close = guess === 1 ? total <= 3 : guess === 10 ? total > 3 && total <= 25 : total > 25;
        res.classList.toggle('is-good', close);
        res.innerHTML = `${close ? 'სწორია!' : 'არა.'} თქვენ თქვით <b>${label}</b> — სინამდვილეში <b>${total}</b> ოპერაცია.`;
      },
    };
  };

  RS.chapters.push({
    id: 'pain',
    short: 'პრობლემა',
    kicker: '01 · პრობლემა',
    title: 'innerHTML ყველაფერს თავიდან აშენებს',
    tocTitle: 'innerHTML ყველაფერს თავიდან აშენებს',
    lead: 'ასე მუშაობს ჩვენი vanilla რესტორანი: state იცვლება → მთელი HTML სტრიქონი თავიდან იწერება → <span class="mono">innerHTML</span>. ერთი ციფრის შესაცვლელად ბრაუზერი ათეულობით კვანძს შლის და ქმნის — და თან ყველაფერს, რაც მათში იყო: focus-ს, კურსორს, ანიმაციას.',
    tryit: [
      'აირჩიეთ პასუხი მარჯვნივ და დააჭირეთ <b>Add</b>-ს.',
      'ძიების ველში აკრიფეთ <b>pizza</b>. რამდენ ასოს მოასწრებთ?',
      'ბოლოს ეს აპი ჩვენივე დაწერილ React-ზე იმუშავებს — და ორივე პრობლემა გაქრება.',
    ],
    code: [{ label: 'app.js · vanilla', source: 'src-vanilla' }],
    lab: {
      title: 'Trattoria — vanilla',
      controls: `<button class="btn" data-reset>${icons.reset}თავიდან</button>`,
      html: () => RS.appLabHTML({
        tree: false,
        side: RS.predictHTML({
          question: 'ერთი <b>Add</b> — რამდენ DOM კვანძს შეეხება ბრაუზერი?',
          options: [[1, '1'], [10, '~10'], [50, '50+']],
          note: '<span class="mono">innerHTML</span>-ს არ აინტერესებს, რა შეიცვალა: ის ძველ კვანძებს შლის და ახლებს ქმნის <b>ყველაფრისთვის</b> — header-ისთვის, ძიების ველისთვის, ყველა ბარათისთვის. მათ შორის თეთრი სივრცის ტექსტური კვანძებისთვისაც.',
        }),
      }),
      mount(el) {
        let fromAdd = false;
        const app = el.querySelector('[data-app]');
        app.addEventListener('click', (e) => { fromAdd = !!e.target.closest('[data-add]'); }, true);
        const guess = RS.predict(el.querySelector('.al-side'));
        const lab = RS.appLab(el, {
          version: 'vanilla',
          source: RS.source('src-vanilla'),
          onUpdate(s) { if (fromAdd) { guess.resolve(s.total); fromAdd = false; } },
        });
        el.querySelector('[data-reset]').addEventListener('click', () => lab.remount());
        return () => lab.destroy();
      },
    },
  });
})();
