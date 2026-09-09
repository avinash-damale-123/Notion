export type Task = {
  id: string;
  name: string;
  project: string;
  subProject: string;
  status: string;
  type: string;
  owner: string;
  dueDate: string;
  createdDate: string;
  completedDate: string;
  progress: number;
  weight: number;
  p1: number | null;
  p2: number | null;
  remarks: string;
};

const API = "https://api.notion.com/v1";
const relationFields = [
  "Main Project",
  "Sub Project",
  "Task Status",
  "Team Allocated",
  "Allocated To",
];
const headers = () => ({
  Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  "Notion-Version": "2025-09-03",
  "Content-Type": "application/json",
});
const textValue = (property: any): string => {
  if (!property) return "";
  if (property.type === "title")
    return property.title?.map((item: any) => item.plain_text).join("") || "";
  if (property.type === "rich_text")
    return (
      property.rich_text?.map((item: any) => item.plain_text).join("") || ""
    );
  if (property.type === "select") return property.select?.name || "";
  if (property.type === "status") return property.status?.name || "";
  if (property.type === "people")
    return (
      property.people
        ?.map((person: any) => person.name || person.person?.email)
        .filter(Boolean)
        .join(", ") || ""
    );
  if (property.type === "formula")
    return property.formula?.string || String(property.formula?.number ?? "");
  return "";
};
const relationIds = (property: any): string[] =>
  property?.relation?.map((item: any) => item.id) || [];
const cleanName = (value: string) => value.replace(/^\s*\d+\.\s*/, "").trim();

async function resolvePageNames(ids: string[]) {
  const names = new Map<string, string>();
  for (let start = 0; start < ids.length; start += 8) {
    const results = await Promise.all(
      ids.slice(start, start + 8).map(async (id) => {
        const response = await fetch(`${API}/pages/${id}`, {
          headers: headers(),
          cache: "no-store",
        });
        if (!response.ok) return [id, ""] as const;
        const page = await response.json();
        const titleProperty = Object.values(page.properties || {}).find(
          (value: any) => value.type === "title",
        );
        return [id, cleanName(textValue(titleProperty))] as const;
      }),
    );
    results.forEach(([id, name]) => names.set(id, name));
  }
  return names;
}

export async function getTasks(): Promise<Task[]> {
  const source = process.env.NOTION_DATA_SOURCE_ID;
  if (!process.env.NOTION_TOKEN || !source) return [];
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const response = await fetch(`${API}/data_sources/${source}/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Notion query failed (${response.status})`);
    const data = await response.json();
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  const ids = [
    ...new Set(
      pages.flatMap((page) =>
        relationFields.flatMap((field) => relationIds(page.properties[field])),
      ),
    ),
  ];
  const names = await resolvePageNames(ids);
  const propertyName = (page: any, field: string) => {
    const property = page.properties[field];
    const direct = cleanName(textValue(property));
    if (direct) return direct;
    return (
      relationIds(property)
        .map((id) => names.get(id))
        .filter(Boolean)
        .join(", ") || "Unassigned"
    );
  };

  return pages
    .map((page) => ({
      id: page.id,
      name: textValue(page.properties["Task Name "]) || "Untitled task",
      project: propertyName(page, "Main Project"),
      subProject: propertyName(page, "Sub Project"),
      status: propertyName(page, "Task Status"),
      type: propertyName(page, "Team Allocated"),
      owner: propertyName(page, "Allocated To"),
      dueDate: page.properties["Due Date"]?.date?.start || "",
      createdDate: page.created_time || "",
      completedDate: page.properties["Date Completed"]?.date?.start || "",
      progress: Math.round((page.properties["Completed %"]?.number || 0) * 100),
      weight: Math.round(
        (page.properties["Task Weightage"]?.number || 0) * 100,
      ),
      p1: page.properties.P1?.number ?? null,
      p2: page.properties.P2?.number ?? null,
      remarks: textValue(page.properties.Remarks),
    }))
    .filter((task) => task.name !== "Untitled task");
}
