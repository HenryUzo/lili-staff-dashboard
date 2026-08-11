import { useEffect, useRef } from "react";
import {
  Bold,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Underline,
} from "lucide-react";

const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "EM", "H3", "I", "LI", "OL", "P", "STRONG", "U", "UL"]);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function toRichTextHtml(value: string) {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return sanitizeRichTextHtml(value);
  return value
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("") || "<p><br></p>";
}

export function sanitizeRichTextHtml(value: string) {
  if (typeof DOMParser === "undefined") return value.replace(/<[^>]*>/g, "");
  const document = new DOMParser().parseFromString(value, "text/html");
  const clean = (node: Node) => {
    for (const child of Array.from(node.childNodes)) clean(child);
    if (!(node instanceof Element)) return;
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    for (const attribute of Array.from(node.attributes)) {
      if (node.tagName !== "A" || attribute.name.toLowerCase() !== "href") {
        node.removeAttribute(attribute.name);
      }
    }
    if (node.tagName === "A") {
      const href = node.getAttribute("href")?.trim() ?? "";
      if (!/^(https?:|mailto:|#)/i.test(href)) node.removeAttribute("href");
      else {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noreferrer");
      }
    }
  };
  clean(document.body);
  return document.body.innerHTML;
}

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-invalid"?: boolean;
};

export function RichTextEditor({ value, onChange, id, "aria-invalid": ariaInvalid }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const normalizedValue = toRichTextHtml(value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const updateValue = () => onChange(sanitizeRichTextHtml(editorRef.current?.innerHTML ?? ""));
  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    updateValue();
  };
  const addLink = () => {
    const url = window.prompt("Paste the link URL");
    if (!url) return;
    command("createLink", /^(https?:|mailto:|#)/i.test(url) ? url : `https://${url}`);
  };
  const tools = [
    ["Bold", "bold", Bold],
    ["Italic", "italic", Italic],
    ["Underline", "underline", Underline],
    ["Bulleted list", "insertUnorderedList", List],
    ["Numbered list", "insertOrderedList", ListOrdered],
    ["Section subheading", "formatBlock", Heading3, "h3"],
    ["Quote", "formatBlock", Quote, "blockquote"],
  ] as const;

  return (
    <div className="overflow-hidden rounded-lg border border-[#DDEBE2] bg-white" aria-invalid={ariaInvalid}>
      <div className="flex flex-wrap gap-1 border-b border-[#DDEBE2] bg-[#F7FAF8] p-2" role="toolbar" aria-label="Text formatting">
        {tools.map(([label, name, Icon, argument]) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name, argument)} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button type="button" title="Add link" aria-label="Add link" onMouseDown={(event) => event.preventDefault()} onClick={addLink} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Link className="h-4 w-4" /></button>
        <button type="button" title="Clear formatting" aria-label="Clear formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => command("removeFormat")} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><RemoveFormatting className="h-4 w-4" /></button>
      </div>
      <div ref={editorRef} id={id} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Section content" aria-invalid={ariaInvalid} onInput={updateValue} onBlur={updateValue} className="min-h-36 p-3 leading-8 text-[#263D35] outline-none empty:before:pointer-events-none empty:before:text-[#789087] empty:before:content-['Write_the_section_body…']" />
    </div>
  );
}
