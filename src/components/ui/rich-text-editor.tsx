import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bold,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";

const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "FONT", "H2", "H3", "H4", "I", "LI", "OL", "P", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL"]);

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
      const name = attribute.name.toLowerCase();
      const isSafeLink = node.tagName === "A" && name === "href";
      const isSafeStyle = name === "style" && /^(color:\s*#[0-9a-f]{6}|text-align:\s*(left|center|right|justify))\s*;?$/i.test(attribute.value);
      const isSafeFontColor = node.tagName === "FONT" && name === "color" && /^#[0-9a-f]{6}$/i.test(attribute.value);
      if (!isSafeLink && !isSafeStyle && !isSafeFontColor) node.removeAttribute(attribute.name);
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
  for (const child of Array.from(document.body.childNodes)) clean(child);
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
  const selectionRef = useRef<Range | null>(null);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState("");
  const normalizedValue = toRichTextHtml(value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const updateValue = () => onChange(sanitizeRichTextHtml(editorRef.current?.innerHTML ?? ""));
  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };
  const hasTextSelection = () => {
    const selection = window.getSelection();
    return Boolean(selection?.rangeCount && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode));
  };
  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    if (!hasTextSelection() && ["bold", "italic", "underline", "foreColor", "createLink", "insertUnorderedList", "insertOrderedList", "formatBlock", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull"].includes(name)) return;
    document.execCommand(name, false, argument);
    saveSelection();
    updateValue();
  };
  const addLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!url) return;
    if (!hasTextSelection() && !selectTextOccurrence(linkText.trim())) {
      setLinkError("Select text in the editor or enter matching text to link.");
      return;
    }
    command("createLink", /^(https?:|mailto:|#)/i.test(url) ? url : `https://${url}`);
    setLinkUrl("");
    setLinkText("");
    setLinkError("");
    setIsLinkFormOpen(false);
  };
  const openLinkForm = () => {
    saveSelection();
    setLinkUrl("");
    setLinkText("");
    setLinkError("");
    setIsLinkFormOpen(true);
  };
  const selectTextOccurrence = (text: string) => {
    const editor = editorRef.current;
    if (!editor || !text) return false;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let content = "";
    let node: Node | null;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
      content += node.textContent ?? "";
    }
    const start = content.toLocaleLowerCase().indexOf(text.toLocaleLowerCase());
    if (start < 0) return false;
    const end = start + text.length;
    let offset = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;
    for (const textNode of nodes) {
      const nextOffset = offset + textNode.length;
      if (!startNode && start >= offset && start <= nextOffset) {
        startNode = textNode;
        startOffset = start - offset;
      }
      if (!endNode && end >= offset && end <= nextOffset) {
        endNode = textNode;
        endOffset = end - offset;
      }
      offset = nextOffset;
    }
    if (!startNode || !endNode) return false;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
    return true;
  };
  const clearFormatting = () => {
    editorRef.current?.focus();
    restoreSelection();
    if (!hasTextSelection()) return;
    const selection = window.getSelection();
    const container = selection?.getRangeAt(0).commonAncestorContainer;
    const element = container?.nodeType === Node.ELEMENT_NODE ? container as Element : container?.parentElement;
    const list = element?.closest("ul, ol");
    if (list?.tagName === "UL") document.execCommand("insertUnorderedList", false);
    if (list?.tagName === "OL") document.execCommand("insertOrderedList", false);
    document.execCommand("removeFormat", false);
    document.execCommand("unlink", false);
    document.execCommand("formatBlock", false, "p");
    saveSelection();
    updateValue();
  };
  const insertTable = () => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, "<table><thead><tr><th>Column heading</th><th>Column heading</th></tr></thead><tbody><tr><td>Cell content</td><td>Cell content</td></tr><tr><td>Cell content</td><td>Cell content</td></tr></tbody></table><p><br></p>");
    saveSelection();
    updateValue();
  };
  const inlineTools = [
    ["Bold", "bold", Bold],
    ["Italic", "italic", Italic],
    ["Underline", "underline", Underline],
    ["Bulleted list", "insertUnorderedList", List],
    ["Numbered list", "insertOrderedList", ListOrdered],
    ["Quote", "formatBlock", Quote, "blockquote"],
  ] as const;
  const alignmentTools = [
    ["Align left", "justifyLeft", AlignLeft],
    ["Align center", "justifyCenter", AlignCenter],
    ["Align right", "justifyRight", AlignRight],
    ["Justify text", "justifyFull", AlignJustify],
  ] as const;

  return (
    <div className="overflow-hidden rounded-lg border border-[#DDEBE2] bg-white" aria-invalid={ariaInvalid}>
      <div className="flex flex-wrap gap-1 border-b border-[#DDEBE2] bg-[#F7FAF8] p-2" role="toolbar" aria-label="Text formatting">
        {inlineTools.map(([label, name, Icon, argument]) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name, argument)} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <label className="relative rounded-md p-2 hover:bg-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#087C48]" title="Text color">
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Text color</span>
          <input type="color" aria-label="Text color" defaultValue="#263D35" onMouseDown={saveSelection} onChange={(event) => command("foreColor", event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <select aria-label="Heading" defaultValue="p" onMouseDown={saveSelection} onChange={(event) => command("formatBlock", event.target.value)} className="h-8 rounded-md border border-[#BFD9C9] bg-white px-2 text-sm text-[#263D35] focus:outline focus:outline-2 focus:outline-[#087C48]">
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        {alignmentTools.map(([label, name, Icon]) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Icon className="h-4 w-4" /></button>
        ))}
        <button type="button" title="Undo" aria-label="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => command("undo")} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Undo2 className="h-4 w-4" /></button>
        <button type="button" title="Redo" aria-label="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => command("redo")} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Redo2 className="h-4 w-4" /></button>
        <button type="button" title="Insert table" aria-label="Insert table" onMouseDown={(event) => event.preventDefault()} onClick={insertTable} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Table2 className="h-4 w-4" /></button>
        <button type="button" title="Add link" aria-label="Add link" onMouseDown={(event) => event.preventDefault()} onClick={openLinkForm} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><Link className="h-4 w-4" /></button>
        <button type="button" title="Clear formatting" aria-label="Clear formatting" onMouseDown={(event) => event.preventDefault()} onClick={clearFormatting} className="rounded-md p-2 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087C48]"><RemoveFormatting className="h-4 w-4" /></button>
      </div>
      {isLinkFormOpen && (
        <form onSubmit={addLink} className="flex flex-wrap items-end gap-2 border-b border-[#DDEBE2] bg-white px-3 py-2" aria-label="Add link form">
          <label htmlFor={`${id ?? "section-content"}-link-text`} className="sr-only">Link text</label>
          <input id={`${id ?? "section-content"}-link-text`} value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Selected text, or type text to link" className="min-w-52 flex-1 rounded-md border border-[#BFD9C9] px-3 py-2 text-sm outline-none focus:border-[#087C48]" />
          <label htmlFor={`${id ?? "section-content"}-link-url`} className="sr-only">Link URL</label>
          <input id={`${id ?? "section-content"}-link-url`} value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} autoFocus placeholder="https://example.com" className="min-w-52 flex-1 rounded-md border border-[#BFD9C9] px-3 py-2 text-sm outline-none focus:border-[#087C48]" />
          <button type="button" onClick={() => setIsLinkFormOpen(false)} className="rounded-md border border-[#BFD9C9] px-3 py-2 text-sm font-medium text-[#263D35] hover:bg-[#F7FAF8]">Cancel</button>
          <button type="submit" className="rounded-md bg-[#087C48] px-3 py-2 text-sm font-semibold text-white hover:bg-[#066A3D]">Add link</button>
          {linkError && <p className="w-full text-sm font-medium text-[#A33A2B]">{linkError}</p>}
        </form>
      )}
      <div ref={editorRef} id={id} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Section content" aria-invalid={ariaInvalid} onInput={updateValue} onBlur={updateValue} onFocus={saveSelection} onKeyUp={saveSelection} onMouseUp={saveSelection} className="min-h-36 p-3 leading-8 text-[#263D35] outline-none empty:before:pointer-events-none empty:before:text-[#789087] empty:before:content-['Write_the_section_body…']" />
    </div>
  );
}
