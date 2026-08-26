function computeStandings(teams, matches, settings) {
  const win = Number(settings.pointsWin ?? 3), draw = Number(settings.pointsDraw ?? 1), loss = Number(settings.pointsLoss ?? 0);
  const table = Object.fromEntries(teams.map(t => [t.id, { teamId:t.id, name:t.name, shortName:t.shortName || t.name, tag:t.tag || '', logoUrl:t.logoUrl || '', played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0,form:[] }]));
  const h2h = {};
  matches.filter(m=>m.status==='completed').sort((a,b)=>new Date(a.scheduledAt||a.createdAt)-new Date(b.scheduledAt||b.createdAt)).forEach(m=>{
    const h=table[m.homeTeamId], a=table[m.awayTeamId]; if(!h||!a)return;
    const hs=Number(m.homeScore||0), as=Number(m.awayScore||0); h.played++;a.played++;h.goalsFor+=hs;h.goalsAgainst+=as;a.goalsFor+=as;a.goalsAgainst+=hs;
    let hp=draw,ap=draw,hr='D',ar='D';
    if(hs>as){h.wins++;a.losses++;hp=win;ap=loss;hr='W';ar='L';}
    else if(as>hs){a.wins++;h.losses++;ap=win;hp=loss;ar='W';hr='L';}
    else {h.draws++;a.draws++;}
    h.points+=hp;a.points+=ap;h.form.push(hr);a.form.push(ar);
    h2h[`${h.teamId}|${a.teamId}`]=(h2h[`${h.teamId}|${a.teamId}`]||0)+hp;
    h2h[`${a.teamId}|${h.teamId}`]=(h2h[`${a.teamId}|${h.teamId}`]||0)+ap;
  });
  const rows=Object.values(table).map(r=>({...r,goalDifference:r.goalsFor-r.goalsAgainst,form:r.form.slice(-5)}));
  rows.sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||((h2h[`${b.teamId}|${a.teamId}`]||0)-(h2h[`${a.teamId}|${b.teamId}`]||0))||a.name.localeCompare(b.name));
  rows.forEach((r,i)=>r.position=i+1); return rows;
}
module.exports={computeStandings};
