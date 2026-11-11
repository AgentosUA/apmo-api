import {
  getBriefingImagePaths,
  getDiaryContent,
  normalizeBriefing,
} from './lib';

const BRIEFING = String.raw`
player createDiaryRecord ["Diary", ["Situation", "Map:<br/><img image='img\Map.PAA' width='360'/><br/>Missing: <img image='img\nope.jpg'/>"]];
`;

describe('briefing images', () => {
  const briefing = normalizeBriefing(BRIEFING);

  it('extracts image paths with forward slashes', () => {
    expect(getBriefingImagePaths(briefing)).toEqual([
      'img/Map.PAA',
      'img/nope.jpg',
    ]);
  });

  it('replaces paths with URLs and drops images without one', () => {
    const [record] = getDiaryContent(
      briefing,
      new Map([['img/Map.PAA', 'http://minio/mission-images/ab/abc.webp']]),
    );

    expect(record.name).toBe('Situation');
    expect(record.value).toBe(
      "Map:<br/><img src='http://minio/mission-images/ab/abc.webp' width='360'/><br/>Missing: ",
    );
  });
});
