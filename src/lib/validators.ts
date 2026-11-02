export const isValidSAID = (id:string) => {
  if(!/^\d{13}$/.test(id)) return false;
  let yy=id.substring(0,2), mm=parseInt(id.substring(2,4)), dd=parseInt(id.substring(4,6));
  let fullYear=parseInt(yy)<50?2000+parseInt(yy):1900+parseInt(yy);
  let d=new Date(fullYear, mm-1, dd);
  if(d.getFullYear()!=fullYear||d.getMonth()!=mm-1||d.getDate()!=dd) return false;
  if(parseInt(id[10])>1) return false;
  let sum=0; for(let i=0;i<12;i++){let n=parseInt(id[i]); sum+= i%2===0? n : (n*2>9? n*2-9 : n*2);}
  return (10-(sum%10))%10===parseInt(id[12]);
}
export const isStrongPassword = (p:string) => p.length>=8 && /\d/.test(p);
