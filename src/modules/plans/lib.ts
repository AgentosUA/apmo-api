const callsigns = [
  'Alpha 1-1',
  'Alpha 1-2',
  'Alpha 1-3',
  'Alpha 1-4',
  'Alpha 1-5',
  'Alpha 1-6',
  'Alpha 2-1',
  'Alpha 2-2',
  'Alpha 2-3',
  'Alpha 2-4',
  'Alpha 2-5',
  'Alpha 2-6',
  'Alpha 3-1',
  'Alpha 3-2',
  'Alpha 3-3',
  'Alpha 3-4',
  'Alpha 3-5',
  'Alpha 3-6',
  'Alpha 4-1',
  'Alpha 4-2',
  'Alpha 4-3',
  'Alpha 4-4',
  'Alpha 4-5',
  'Alpha 4-6',
  'Alpha 5-1',
  'Alpha 5-2',
  'Alpha 5-3',
  'Alpha 5-4',
  'Alpha 5-5',
  'Alpha 5-6',
];

const callsignsObject = (function () {
  return callsigns.reduce((acc, curr) => {
    acc[curr] = '';

    return acc;
  }, {});
})();

export { callsigns, callsignsObject };
