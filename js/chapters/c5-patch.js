// 05 · Reconciliation. Same app, same app code — flip the engine between v0.4 and v0.5 and watch the meter.
(function () {
  const { icons } = RS;

  RS.chapters.push({
    id: 'patch',
    short: 'reconciliation',
    kicker: '05 · RECONCILIATION',
    title: 'შევადაროთ — და შევცვალოთ მხოლოდ განსხვავება',
    tocTitle: 'მხოლოდ განსხვავება',
    lead: '<span class="mono">patch()</span> ძველ და ახალ ხეს ერთად ჩაუყვება. <b>იგივე ტიპი</b> → DOM კვანძი რჩება, ვანახლებთ მხოლოდ შეცვლილ props-ს და ტექსტს. <b>სხვა ტიპი</b> → ვცვლით. ეს ალგორითმი — <b>reconciliation</b> — React-ის გულია. ახალი ხე ყოველ ჯერზე იქმნება, მაგრამ ობიექტები იაფია; ძვირი DOM-ია.',
    tryit: [
      'Add: ახლა ერთი ტექსტის ცვლილებაა ~90 ოპერაციის ნაცვლად.',
      'ძიება ჩვეულებრივად მუშაობს — input იგივე კვანძია, focus არ იკარგება.',
      'გადართეთ ძრავი <b>v0.4 ↔ v0.5</b>: აპი და მისი კოდი იგივეა, იცვლება მხოლოდ mini-react.',
    ],
    code: [
      { label: 'mini-react.js', lib: 5 },
      { label: 'app.jsx', source: 'app-global' },
    ],
    lab: {
      title: 'Trattoria',
      controls: `
        <span class="lab-label">ძრავი</span>
        <span class="seg" data-engine><button data-v="4">v0.4 · ყველაფერი თავიდან</button><button data-v="5" class="is-on">v0.5 · patch()</button></span>
        <button class="btn" data-reset>${icons.reset}თავიდან</button>`,
      html: () => RS.appLabHTML({ tree: true }),
      mount(el) {
        const avg = { 4: [], 5: [] };
        let version = 5;
        const lab = RS.appLab(el, {
          version,
          source: RS.source('app-global'),
          onUpdate(s) {
            if (!s.total) return;
            avg[version].push(s.total);
            paintAvg();
          },
        });
        const sum = el.querySelector('[data-tree-sum]');
        const meterFoot = el.querySelector('.meter-foot');
        const cmp = document.createElement('p');
        cmp.className = 'meter-foot mono';
        meterFoot.after(cmp);
        const mean = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : '—');
        function paintAvg() {
          cmp.innerHTML = `საშუალოდ ერთ განახლებაზე: v0.4 — <b>${mean(avg[4])}</b> · v0.5 — <b>${mean(avg[5])}</b>`;
        }
        paintAvg();
        el.querySelector('[data-engine]').addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          version = Number(b.dataset.v);
          el.querySelectorAll('[data-engine] button').forEach((x) => x.classList.toggle('is-on', x === b));
          lab.remount({ version });
          el.querySelector('.lab-title').textContent = `Trattoria — mini-react v0.${version}`;
          if (sum) sum.textContent = '';
        });
        el.querySelector('.lab-title').textContent = 'Trattoria — mini-react v0.5';
        el.querySelector('[data-reset]').addEventListener('click', () => lab.remount());
        return () => lab.destroy();
      },
    },
  });
})();
