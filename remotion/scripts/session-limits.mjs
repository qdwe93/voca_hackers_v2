// 한 세션(한 번의 AI 실행)에서 넘기면 안 되는 분량. 문서가 아니라 코드로 막는다.
//
// 근거: v1 에서 "DAY 20~25 전부 한 번에" 요청이 컨텍스트 초과로 중간에 끊겼고,
// 이미지 단계는 외부 도구 쿼터(429)에서 멈췄다. 끊기면 어디까지 됐는지 추적하는 비용이
// 작업 자체보다 크다. 그래서 각 스크립트가 한 번에 처리할 상한을 스스로 거부한다.

export const LIMITS = {
  // 1단계: 외부 AI 한 세션이 만들 콘텐츠·프롬프트 분량
  contentDaysPerSession: 10, // DAY 10개 = 40세트 = words.json 40 + 프롬프트 800개
  // 2단계: 이미지 생성 스크립트 1회 실행 상한 (쿼터·중단 복구 비용 기준)
  imagesPerRun: 80, // = DAY 1개(4세트)
  imagesPerRunHardMax: 200, // --max 로 올릴 수 있는 최대치
  // 3단계: 사람이 한 번에 눈으로 판정할 수 있는 분량
  reviewSetsPerSession: 20,
  // 4단계: 배치는 길어도 되지만, 무인 실행이 아니면 나눈다
  renderSetsPerRun: 120,
};

export const refuseIfTooBig = ({label, count, limit, hardMax, override, hint}) => {
  const ceiling = override ?? limit;
  if (hardMax !== undefined && ceiling > hardMax) {
    console.error(
      `${label}: 1회 상한은 ${hardMax} 이다 (요청 ${ceiling}). 이 이상은 나눠서 실행한다.`,
    );
    process.exit(2);
  }
  if (count > ceiling) {
    console.error(
      `${label}: 한 번에 ${count} 개는 너무 많다 (1회 권장 상한 ${limit}).\n` +
        `  ${hint}\n` +
        `  상한을 올려야 한다면 --max <n> 을 명시한다 (최대 ${hardMax ?? limit}).`,
    );
    process.exit(2);
  }
};
