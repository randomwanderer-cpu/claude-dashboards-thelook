(function () {
  const calcs = {};
  let P = {months: 12, department: null, category: null, channel: null, state: null};
  let renderFn = () => {};
  const rows = (id) => {
    const drill = P.department === 'Men' && P.category === 'Outerwear & Coats';
    return (drill && FIX.s1[id]) || FIX.s0[id];
  };
  window.dash = {
    colors: ['#4f7cff', '#ff8a3d', '#22b07d', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#84cc16'],
    data(id) {
      if (calcs[id]) return {status: 'ok', data: calcs[id].fn(...calcs[id].inputs.map((i) => dash.data(i).data)), columns: []};
      const r = rows(id);
      return r ? {status: 'ok', data: r, columns: []} : {status: 'missing', data: []};
    },
    calc(id, o) { calcs[id] = o; },
    onData(fn) { renderFn = fn; fn(); },
    params() { return {...P}; },
    setParams(o) { Object.assign(P, o); renderFn(); },
    resetParams() { P = {months: 12, department: null, category: null, channel: null, state: null}; renderFn(); },
    setLink() {}, loader() {}, refresh() {}
  };
})();
