import { NextResponse } from "next/server"; import { getTasks } from "../../../lib/notion"; import { demoTasks } from "../../../lib/demo";
export const dynamic="force-dynamic";
export async function GET(){try{const tasks=await getTasks();return NextResponse.json({tasks:tasks.length?tasks:demoTasks,source:tasks.length?"notion":"demo",syncedAt:new Date().toISOString()});}catch(e){return NextResponse.json({tasks:demoTasks,source:"demo",warning:e instanceof Error?e.message:"Notion unavailable",syncedAt:new Date().toISOString()});}}
