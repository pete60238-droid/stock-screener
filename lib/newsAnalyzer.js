export function basicSentimentFromTitles(titles=[]) {
  const text = titles.join(' ').toLowerCase();
  const pos = ['beat','surge','record','upgrade','strong','profit','grow','ai','partnership','win'];
  const neg = ['miss','fall','downgrade','layoff','probe','loss','debt','lawsuit','delay','guidance cut'];
  let score=0; for(const w of pos) if(text.includes(w)) score+=1; for(const w of neg) if(text.includes(w)) score-=1;
  return Math.max(-3,Math.min(3,score));
}
