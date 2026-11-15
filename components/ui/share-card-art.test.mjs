import test from 'node:test';
import assert from 'node:assert/strict';
import { cardLines, drawCard } from '../../lib/share/card.ts';

test('share art places username on the picture and omits group copy and slogans', () => {
  const data = { username: 'jay', streak: 2, mealsToday: 1, goalMet: false, group: { name: 'hello', completion: 50 } };
  assert.deepEqual(cardLines(data), ['2-day streak', '1 meal logged today']);
  const texts = [];
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 20 }), fillText: (...args) => texts.push(args) }, {
    get: (target, key) => target[key] ?? (() => {}),
  });
  drawCard(ctx, data, [{}, {}], {}, 'sans-serif');
  const tag = texts.find(([text]) => text === '@jay');
  assert.ok(tag[1] > 900 && tag[2] > 780 && tag[2] < 860);
  assert.ok(texts.some(([text]) => text === 'DAY STREAK'));
  assert.ok(!texts.some(([text]) => /hello|group|Small steps|world of progress/i.test(text)));
});
