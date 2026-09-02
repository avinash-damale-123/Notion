export type Task = { id:string; name:string; project:string; subProject:string; status:string; type:string; owner:string; dueDate:string; createdDate:string; completedDate:string; progress:number; weight:number; p1:number|null; p2:number|null; remarks:string };

const API = "https://api.notion.com/v1";
const headers = () => ({ Authorization:`Bearer ${process.env.NOTION_TOKEN}`, "Notion-Version":"2025-09-03", "Content-Type":"application/json" });
const title = (p:any) => p?.title?.map((x:any)=>x.plain_text).join("") || p?.rich_text?.map((x:any)=>x.plain_text).join("") || "";
const relationIds = (p:any) => p?.relation?.map((x:any)=>x.id) || [];

export async function getTasks(): Promise<Task[]> {
  const source = process.env.NOTION_DATA_SOURCE_ID;
  if (!process.env.NOTION_TOKEN || !source) return [];
  const pages:any[]=[]; let cursor:string|undefined;
  do {
    const res=await fetch(`${API}/data_sources/${source}/query`,{method:"POST",headers:headers(),body:JSON.stringify({page_size:100,...(cursor?{start_cursor:cursor}:{})}),cache:"no-store"});
    if(!res.ok) throw new Error(`Notion query failed (${res.status})`);
    const data=await res.json(); pages.push(...data.results); cursor=data.has_more?data.next_cursor:undefined;
  } while(cursor);
  const ids=[...new Set(pages.flatMap(p=>["Main Project","Sub Project","Task Status","Team Allocated","Allocated To"].flatMap(k=>relationIds(p.properties[k]))))];
  const pairs=await Promise.all(ids.map(async id=>{const r=await fetch(`${API}/pages/${id}`,{headers:headers(),cache:"force-cache"});if(!r.ok)return [id,"Unknown"] as const;const p=await r.json();const prop=Object.values(p.properties).find((v:any)=>v.type==="title");return [id,title(prop)] as const;}));
  const names=new Map(pairs); const rel=(p:any,k:string)=>relationIds(p.properties[k]).map((id:string)=>names.get(id)).filter(Boolean).join(", ")||"Unassigned";
  return pages.map(p=>({id:p.id,name:title(p.properties["Task Name "])||"Untitled task",project:rel(p,"Main Project"),subProject:rel(p,"Sub Project"),status:rel(p,"Task Status"),type:rel(p,"Team Allocated"),owner:rel(p,"Allocated To"),dueDate:p.properties["Due Date"]?.date?.start||"",createdDate:p.created_time||"",completedDate:p.properties["Date Completed"]?.date?.start||"",progress:Math.round((p.properties["Completed %"]?.number||0)*100),weight:Math.round((p.properties["Task Weightage"]?.number||0)*100),p1:p.properties.P1?.number??null,p2:p.properties.P2?.number??null,remarks:title(p.properties.Remarks)})).filter(t=>t.name!=="Untitled task");
}
