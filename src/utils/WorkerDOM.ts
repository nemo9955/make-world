import { ActionsManager } from "./Actions";


class DUMMY_CLASS{}

export class WorkerDOM implements HTMLElement {
    // export class WorkerDOM  {


    actions = new ActionsManager();

    // TODO find a way to warn user if forgot to auto-update size of Element
    clientHeight: number;
    clientWidth: number;

    ownerDocument: any;
    document: any;

    style: any = {};
    // style: CSSStyleDeclaration;

    constructor() {

        if (global.document === undefined) {
            // https://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript/33268326#33268326
            // if in worker, add a dummy document so it is defined
            // console.log("global.document", global.document);
            console.log("undefined document (worker), declaring 'document' as null");
            // global.document = null;
            global.document = new WorkerDocument(this);
            global.SVGElement = DUMMY_CLASS as any; // assign any random type to not fail an instaceof check
        }

        this.ownerDocument = this;
        this.document = {
            documentElement: this
        };

    }


    addEventListener(type: string, listener: any, options?: any) {
        // console.log("#HERELINE WorkerDOM addEventListener ", type);
        this.actions.addAction(type, listener)
    }

    dispatchEvent(event: any): boolean {

        var stopAct = function () { event["stopAfterMe"] = true; };
        event.composedPath = stopAct;
        event.preventDefault = stopAct;
        event.stopImmediatePropagation = stopAct;
        event.stopPropagation = stopAct;

        event.view = this;

        // console.log("event[type]", event["type"], event);
        this.actions.callThisAction(event["type"], this, event)
        return true;
    }
    removeEventListener(type: any, listener: any, options?: any) {
        // console.log("#HERELINE WorkerDOM removeEventListener ", type);
        this.actions.removeAction(type, listener)
    }


    focus(options?: FocusOptions): void { }

    click(): void { throw new Error("Method not implemented."); }
    blur(): void { throw new Error("Method not implemented."); }
    attachShadow(init: ShadowRootInit): ShadowRoot { throw new Error("Method not implemented."); }
    closest(selector: any) { throw new Error("Method not implemented."); }
    getAttribute(qualifiedName: string): string { throw new Error("Method not implemented."); }
    getAttributeNS(namespace: string, localName: string): string { throw new Error("Method not implemented."); }
    getAttributeNames(): string[] { throw new Error("Method not implemented."); }
    getAttributeNode(qualifiedName: string): Attr { throw new Error("Method not implemented."); }
    getAttributeNodeNS(namespace: string, localName: string): Attr { throw new Error("Method not implemented."); }
    getBoundingClientRect(): DOMRect { throw new Error("Method not implemented."); }
    getClientRects(): DOMRectList { throw new Error("Method not implemented."); }
    getElementsByClassName(classNames: string): HTMLCollectionOf<Element> { throw new Error("Method not implemented."); }
    getElementsByTagName(qualifiedName: any) { throw new Error("Method not implemented."); return null; }
    getElementsByTagNameNS(namespaceURI: any, localName: any) { throw new Error("Method not implemented."); return null; }
    hasAttribute(qualifiedName: string): boolean { throw new Error("Method not implemented."); }
    hasAttributeNS(namespace: string, localName: string): boolean { throw new Error("Method not implemented."); }
    hasAttributes(): boolean { throw new Error("Method not implemented."); }
    hasPointerCapture(pointerId: number): boolean { throw new Error("Method not implemented."); }
    insertAdjacentElement(position: InsertPosition, insertedElement: Element): Element { throw new Error("Method not implemented."); }
    insertAdjacentHTML(where: InsertPosition, html: string): void { throw new Error("Method not implemented."); }
    insertAdjacentText(where: InsertPosition, text: string): void { throw new Error("Method not implemented."); }
    matches(selectors: string): boolean { throw new Error("Method not implemented."); }
    msGetRegionContent() { throw new Error("Method not implemented."); }
    releasePointerCapture(pointerId: number): void { throw new Error("Method not implemented."); }
    removeAttribute(qualifiedName: string): void { throw new Error("Method not implemented."); }
    removeAttributeNS(namespace: string, localName: string): void { throw new Error("Method not implemented."); }
    removeAttributeNode(attr: Attr): Attr { throw new Error("Method not implemented."); }
    requestFullscreen(options?: FullscreenOptions): Promise<void> { throw new Error("Method not implemented."); }
    requestPointerLock(): void { throw new Error("Method not implemented."); }
    scroll(x?: any, y?: any) { throw new Error("Method not implemented."); }
    scrollBy(x?: any, y?: any) { throw new Error("Method not implemented."); }
    scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void { throw new Error("Method not implemented."); }
    scrollTo(x?: any, y?: any) { throw new Error("Method not implemented."); }
    setAttribute(qualifiedName: string, value: string): void { throw new Error("Method not implemented."); }
    setAttributeNS(namespace: string, qualifiedName: string, value: string): void { throw new Error("Method not implemented."); }
    setAttributeNode(attr: Attr): Attr { throw new Error("Method not implemented."); }
    setAttributeNodeNS(attr: Attr): Attr { throw new Error("Method not implemented."); }
    setPointerCapture(pointerId: number): void { throw new Error("Method not implemented."); }
    toggleAttribute(qualifiedName: string, force?: boolean): boolean { throw new Error("Method not implemented."); }
    webkitMatchesSelector(selectors: string): boolean { throw new Error("Method not implemented."); }
    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: number | KeyframeAnimationOptions): Animation { throw new Error("Method not implemented."); }
    getAnimations(): Animation[] { throw new Error("Method not implemented."); }
    after(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    before(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    remove(): void { throw new Error("Method not implemented."); }
    replaceWith(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    append(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    prepend(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    querySelector(selectors: any) { throw new Error("Method not implemented."); }
    querySelectorAll(selectors: any) { throw new Error("Method not implemented."); return null; }
    appendChild<T extends Node>(newChild: T): T { throw new Error("Method not implemented."); }
    cloneNode(deep?: boolean): Node { throw new Error("Method not implemented."); }
    compareDocumentPosition(other: Node): number { throw new Error("Method not implemented."); }
    contains(other: Node): boolean { throw new Error("Method not implemented."); }
    getRootNode(options?: GetRootNodeOptions): Node { throw new Error("Method not implemented."); }
    hasChildNodes(): boolean { throw new Error("Method not implemented."); }
    insertBefore<T extends Node>(newChild: T, refChild: Node): T { throw new Error("Method not implemented."); }
    isDefaultNamespace(namespace: string): boolean { throw new Error("Method not implemented."); }
    isEqualNode(otherNode: Node): boolean { throw new Error("Method not implemented."); }
    isSameNode(otherNode: Node): boolean { throw new Error("Method not implemented."); }
    lookupNamespaceURI(prefix: string): string { throw new Error("Method not implemented."); }
    lookupPrefix(namespace: string): string { throw new Error("Method not implemented."); }
    normalize(): void { throw new Error("Method not implemented."); }
    removeChild<T extends Node>(oldChild: T): T { throw new Error("Method not implemented."); }
    replaceChild<T extends Node>(newChild: Node, oldChild: T): T { throw new Error("Method not implemented."); }
    oncopy: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    oncut: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    onpaste: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    onabort: (this: GlobalEventHandlers, ev: UIEvent) => any;
    onanimationcancel: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationend: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationiteration: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationstart: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onauxclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onblur: (this: GlobalEventHandlers, ev: FocusEvent) => any;
    oncancel: (this: GlobalEventHandlers, ev: Event) => any;
    oncanplay: (this: GlobalEventHandlers, ev: Event) => any;
    oncanplaythrough: (this: GlobalEventHandlers, ev: Event) => any;
    onchange: (this: GlobalEventHandlers, ev: Event) => any;
    onclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onclose: (this: GlobalEventHandlers, ev: Event) => any;
    oncontextmenu: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    oncuechange: (this: GlobalEventHandlers, ev: Event) => any;
    ondblclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    ondrag: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragend: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragenter: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragexit: (this: GlobalEventHandlers, ev: Event) => any;
    ondragleave: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragover: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragstart: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondrop: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondurationchange: (this: GlobalEventHandlers, ev: Event) => any;
    onemptied: (this: GlobalEventHandlers, ev: Event) => any;
    onended: (this: GlobalEventHandlers, ev: Event) => any;
    onerror: OnErrorEventHandlerNonNull;
    onfocus: (this: GlobalEventHandlers, ev: FocusEvent) => any;
    ongotpointercapture: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    oninput: (this: GlobalEventHandlers, ev: Event) => any;
    oninvalid: (this: GlobalEventHandlers, ev: Event) => any;
    onkeydown: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onkeypress: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onkeyup: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onload: (this: GlobalEventHandlers, ev: Event) => any;
    onloadeddata: (this: GlobalEventHandlers, ev: Event) => any;
    onloadedmetadata: (this: GlobalEventHandlers, ev: Event) => any;
    onloadstart: (this: GlobalEventHandlers, ev: Event) => any;
    onlostpointercapture: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onmousedown: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseenter: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseleave: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmousemove: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseout: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseover: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseup: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onpause: (this: GlobalEventHandlers, ev: Event) => any;
    onplay: (this: GlobalEventHandlers, ev: Event) => any;
    onplaying: (this: GlobalEventHandlers, ev: Event) => any;
    onpointercancel: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerdown: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerenter: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerleave: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointermove: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerout: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerover: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerup: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onprogress: (this: GlobalEventHandlers, ev: ProgressEvent<EventTarget>) => any;
    onratechange: (this: GlobalEventHandlers, ev: Event) => any;
    onreset: (this: GlobalEventHandlers, ev: Event) => any;
    onresize: (this: GlobalEventHandlers, ev: UIEvent) => any;
    onscroll: (this: GlobalEventHandlers, ev: Event) => any;
    onsecuritypolicyviolation: (this: GlobalEventHandlers, ev: SecurityPolicyViolationEvent) => any;
    onseeked: (this: GlobalEventHandlers, ev: Event) => any;
    onseeking: (this: GlobalEventHandlers, ev: Event) => any;
    onselect: (this: GlobalEventHandlers, ev: Event) => any;
    onselectionchange: (this: GlobalEventHandlers, ev: Event) => any;
    onselectstart: (this: GlobalEventHandlers, ev: Event) => any;
    onstalled: (this: GlobalEventHandlers, ev: Event) => any;
    onsubmit: (this: GlobalEventHandlers, ev: Event) => any;
    onsuspend: (this: GlobalEventHandlers, ev: Event) => any;
    ontimeupdate: (this: GlobalEventHandlers, ev: Event) => any;
    ontoggle: (this: GlobalEventHandlers, ev: Event) => any;
    ontouchcancel?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchend?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchmove?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchstart?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontransitioncancel: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionend: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionrun: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionstart: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    onvolumechange: (this: GlobalEventHandlers, ev: Event) => any;
    onwaiting: (this: GlobalEventHandlers, ev: Event) => any;
    onwheel: (this: GlobalEventHandlers, ev: WheelEvent) => any;
    onfullscreenchange: (this: Element, ev: Event) => any;
    onfullscreenerror: (this: Element, ev: Event) => any;
    baseURI: string;
    childNodes: NodeListOf<ChildNode>;
    firstChild: ChildNode;
    isConnected: boolean;
    lastChild: ChildNode;
    nextSibling: ChildNode;
    nodeName: string;
    nodeType: number;
    nodeValue: string;
    parentElement: HTMLElement;
    parentNode: Node & ParentNode;
    previousSibling: ChildNode;
    textContent: string;
    ATTRIBUTE_NODE: number;
    CDATA_SECTION_NODE: number;
    COMMENT_NODE: number;
    DOCUMENT_FRAGMENT_NODE: number;
    DOCUMENT_NODE: number;
    DOCUMENT_POSITION_CONTAINED_BY: number;
    DOCUMENT_POSITION_CONTAINS: number;
    DOCUMENT_POSITION_DISCONNECTED: number;
    DOCUMENT_POSITION_FOLLOWING: number;
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: number;
    DOCUMENT_POSITION_PRECEDING: number;
    DOCUMENT_TYPE_NODE: number;
    ELEMENT_NODE: number;
    ENTITY_NODE: number;
    ENTITY_REFERENCE_NODE: number;
    NOTATION_NODE: number;
    PROCESSING_INSTRUCTION_NODE: number;
    TEXT_NODE: number;
    innerHTML: string;
    nextElementSibling: Element;
    previousElementSibling: Element;
    childElementCount: number;
    children: HTMLCollection;
    firstElementChild: Element;
    lastElementChild: Element;
    contentEditable: string;
    enterKeyHint: string;
    inputMode: string;
    isContentEditable: boolean;
    autofocus: boolean;
    dataset: DOMStringMap;
    nonce?: string;
    tabIndex: number = 0;
    accessKey: string;
    accessKeyLabel: string;
    autocapitalize: string;
    dir: string;
    draggable: boolean;
    hidden: boolean;
    innerText: string;
    lang: string;
    offsetHeight: number;
    offsetLeft: number;
    offsetParent: Element;
    offsetTop: number;
    offsetWidth: number;
    spellcheck: boolean;
    title: string;
    translate: boolean;
    assignedSlot: HTMLSlotElement;
    attributes: NamedNodeMap;
    classList: DOMTokenList;
    className: string;
    clientLeft: number;
    clientTop: number;
    id: string;
    localName: string;
    namespaceURI: string;
    outerHTML: string;
    prefix: string;
    scrollHeight: number;
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    shadowRoot: ShadowRoot;
    slot: string;
    tagName: string;
}


export class WorkerDocument implements Document {


    constructor(workDOM: any) {
        this.ownerDocument = workDOM;
    }

    URL: string;
    alinkColor: string;
    all: HTMLAllCollection;
    anchors: HTMLCollectionOf<HTMLAnchorElement>;
    applets: HTMLCollectionOf<HTMLAppletElement>;
    bgColor: string;
    body: HTMLElement;
    characterSet: string;
    charset: string;
    compatMode: string;
    contentType: string;
    cookie: string;
    currentScript: HTMLOrSVGScriptElement;
    defaultView: Window & typeof globalThis;
    designMode: string;
    dir: string;
    doctype: DocumentType;
    documentElement: HTMLElement;
    documentURI: string;
    domain: string;
    embeds: HTMLCollectionOf<HTMLEmbedElement>;
    fgColor: string;
    forms: HTMLCollectionOf<HTMLFormElement>;
    fullscreen: boolean;
    fullscreenEnabled: boolean;
    head: HTMLHeadElement;
    hidden: boolean;
    images: HTMLCollectionOf<HTMLImageElement>;
    implementation: DOMImplementation;
    inputEncoding: string;
    lastModified: string;
    linkColor: string;
    links: HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement>;
    location: Location;
    childElementCount: number;
    children: HTMLCollection;
    firstElementChild: Element;
    lastElementChild: Element;
    ownerDocument: null;
    plugins: HTMLCollectionOf<HTMLEmbedElement>;
    readyState: DocumentReadyState;
    referrer: string;
    scripts: HTMLCollectionOf<HTMLScriptElement>;
    scrollingElement: Element;
    timeline: DocumentTimeline;
    title: string;
    visibilityState: VisibilityState;
    vlinkColor: string;
    onfullscreenchange: (this: Document, ev: Event) => any;
    onfullscreenerror: (this: Document, ev: Event) => any;
    onpointerlockchange: (this: Document, ev: Event) => any;
    onpointerlockerror: (this: Document, ev: Event) => any;
    onreadystatechange: (this: Document, ev: Event) => any;
    onvisibilitychange: (this: Document, ev: Event) => any;
    adoptNode<T extends Node>(source: T): T { throw new Error("Method not implemented."); }
    captureEvents(): void { throw new Error("Method not implemented."); }
    caretPositionFromPoint(x: number, y: number): CaretPosition { throw new Error("Method not implemented."); }
    caretRangeFromPoint(x: number, y: number): Range { throw new Error("Method not implemented."); }
    clear(): void { throw new Error("Method not implemented."); }
    close(): void { throw new Error("Method not implemented."); }
    createAttribute(localName: string): Attr { throw new Error("Method not implemented."); }
    createAttributeNS(namespace: string, qualifiedName: string): Attr { throw new Error("Method not implemented."); }
    createCDATASection(data: string): CDATASection { throw new Error("Method not implemented."); }
    createComment(data: string): Comment { throw new Error("Method not implemented."); }
    createDocumentFragment(): DocumentFragment { throw new Error("Method not implemented."); }
    createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K];
    createElement<K extends keyof HTMLElementDeprecatedTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementDeprecatedTagNameMap[K];
    createElement(tagName: any, options?: any) { throw new Error("Method not implemented."); return null; }
    createElementNS(namespace: any, qualifiedName: any, options?: any) { throw new Error("Method not implemented."); return null; }
    createEvent(eventInterface: any) { throw new Error("Method not implemented."); return null; }
    createNodeIterator(root: Node, whatToShow?: number, filter?: NodeFilter): NodeIterator { throw new Error("Method not implemented."); }
    createProcessingInstruction(target: string, data: string): ProcessingInstruction { throw new Error("Method not implemented."); }
    createRange(): Range { throw new Error("Method not implemented."); }
    createTextNode(data: string): Text { throw new Error("Method not implemented."); }
    createTreeWalker(root: any, whatToShow?: any, filter?: any, entityReferenceExpansion?: any) { throw new Error("Method not implemented."); return null; }
    elementFromPoint(x: number, y: number): Element { throw new Error("Method not implemented."); }
    elementsFromPoint(x: number, y: number): Element[] { throw new Error("Method not implemented."); }
    execCommand(commandId: string, showUI?: boolean, value?: string): boolean { throw new Error("Method not implemented."); }
    exitFullscreen(): Promise<void> { throw new Error("Method not implemented."); }
    exitPointerLock(): void { throw new Error("Method not implemented."); }
    getAnimations(): Animation[] { throw new Error("Method not implemented."); }
    getElementById(elementId: string): HTMLElement { throw new Error("Method not implemented."); }
    getElementsByClassName(classNames: string): HTMLCollectionOf<Element> { throw new Error("Method not implemented."); }
    getElementsByName(elementName: string): NodeListOf<HTMLElement> { throw new Error("Method not implemented."); }
    getElementsByTagName<K extends keyof HTMLElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<HTMLElementTagNameMap[K]>;
    getElementsByTagName<K extends keyof SVGElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<SVGElementTagNameMap[K]>;
    getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
    getElementsByTagName(qualifiedName: any) { throw new Error("Method not implemented."); return null; }
    getElementsByTagNameNS(namespaceURI: "http://www.w3.org/1999/xhtml", localName: string): HTMLCollectionOf<HTMLElement>;
    getElementsByTagNameNS(namespaceURI: "http://www.w3.org/2000/svg", localName: string): HTMLCollectionOf<SVGElement>;
    getElementsByTagNameNS(namespaceURI: string, localName: string): HTMLCollectionOf<Element>;
    getElementsByTagNameNS(namespaceURI: any, localName: any) { throw new Error("Method not implemented."); return null; }
    getSelection(): Selection { throw new Error("Method not implemented."); }
    hasFocus(): boolean { throw new Error("Method not implemented."); }
    importNode<T extends Node>(importedNode: T, deep: boolean): T { throw new Error("Method not implemented."); }
    open(url?: string, name?: string, features?: string, replace?: boolean): Document { throw new Error("Method not implemented."); }
    queryCommandEnabled(commandId: string): boolean { throw new Error("Method not implemented."); }
    queryCommandIndeterm(commandId: string): boolean { throw new Error("Method not implemented."); }
    queryCommandState(commandId: string): boolean { throw new Error("Method not implemented."); }
    queryCommandSupported(commandId: string): boolean { throw new Error("Method not implemented."); }
    queryCommandValue(commandId: string): string { throw new Error("Method not implemented."); }
    releaseEvents(): void { throw new Error("Method not implemented."); }
    write(...text: string[]): void { throw new Error("Method not implemented."); }
    writeln(...text: string[]): void { throw new Error("Method not implemented."); }
    addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: any, listener: any, options?: any) { throw new Error("Method not implemented."); }
    removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: any, listener: any, options?: any) { throw new Error("Method not implemented."); }
    baseURI: string;
    childNodes: NodeListOf<ChildNode>;
    firstChild: ChildNode;
    isConnected: boolean;
    lastChild: ChildNode;
    namespaceURI: string;
    nextSibling: ChildNode;
    nodeName: string;
    nodeType: number;
    nodeValue: string;
    parentElement: HTMLElement;
    parentNode: Node & ParentNode;
    previousSibling: ChildNode;
    textContent: string;
    appendChild<T extends Node>(newChild: T): T { throw new Error("Method not implemented."); }
    cloneNode(deep?: boolean): Node { throw new Error("Method not implemented."); }
    compareDocumentPosition(other: Node): number { throw new Error("Method not implemented."); }
    contains(other: Node): boolean { throw new Error("Method not implemented."); }
    getRootNode(options?: GetRootNodeOptions): Node { throw new Error("Method not implemented."); }
    hasChildNodes(): boolean { throw new Error("Method not implemented."); }
    insertBefore<T extends Node>(newChild: T, refChild: Node): T { throw new Error("Method not implemented."); }
    isDefaultNamespace(namespace: string): boolean { throw new Error("Method not implemented."); }
    isEqualNode(otherNode: Node): boolean { throw new Error("Method not implemented."); }
    isSameNode(otherNode: Node): boolean { throw new Error("Method not implemented."); }
    lookupNamespaceURI(prefix: string): string { throw new Error("Method not implemented."); }
    lookupPrefix(namespace: string): string { throw new Error("Method not implemented."); }
    normalize(): void { throw new Error("Method not implemented."); }
    removeChild<T extends Node>(oldChild: T): T { throw new Error("Method not implemented."); }
    replaceChild<T extends Node>(newChild: Node, oldChild: T): T { throw new Error("Method not implemented."); }
    ATTRIBUTE_NODE: number;
    CDATA_SECTION_NODE: number;
    COMMENT_NODE: number;
    DOCUMENT_FRAGMENT_NODE: number;
    DOCUMENT_NODE: number;
    DOCUMENT_POSITION_CONTAINED_BY: number;
    DOCUMENT_POSITION_CONTAINS: number;
    DOCUMENT_POSITION_DISCONNECTED: number;
    DOCUMENT_POSITION_FOLLOWING: number;
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: number;
    DOCUMENT_POSITION_PRECEDING: number;
    DOCUMENT_TYPE_NODE: number;
    ELEMENT_NODE: number;
    ENTITY_NODE: number;
    ENTITY_REFERENCE_NODE: number;
    NOTATION_NODE: number;
    PROCESSING_INSTRUCTION_NODE: number;
    TEXT_NODE: number;
    dispatchEvent(event: Event): boolean { throw new Error("Method not implemented."); }
    oncopy: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    oncut: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    onpaste: (this: DocumentAndElementEventHandlers, ev: ClipboardEvent) => any;
    activeElement: Element;
    fullscreenElement: Element;
    pointerLockElement: Element;
    styleSheets: StyleSheetList;
    onabort: (this: GlobalEventHandlers, ev: UIEvent) => any;
    onanimationcancel: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationend: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationiteration: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onanimationstart: (this: GlobalEventHandlers, ev: AnimationEvent) => any;
    onauxclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onblur: (this: GlobalEventHandlers, ev: FocusEvent) => any;
    oncancel: (this: GlobalEventHandlers, ev: Event) => any;
    oncanplay: (this: GlobalEventHandlers, ev: Event) => any;
    oncanplaythrough: (this: GlobalEventHandlers, ev: Event) => any;
    onchange: (this: GlobalEventHandlers, ev: Event) => any;
    onclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onclose: (this: GlobalEventHandlers, ev: Event) => any;
    oncontextmenu: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    oncuechange: (this: GlobalEventHandlers, ev: Event) => any;
    ondblclick: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    ondrag: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragend: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragenter: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragexit: (this: GlobalEventHandlers, ev: Event) => any;
    ondragleave: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragover: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondragstart: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondrop: (this: GlobalEventHandlers, ev: DragEvent) => any;
    ondurationchange: (this: GlobalEventHandlers, ev: Event) => any;
    onemptied: (this: GlobalEventHandlers, ev: Event) => any;
    onended: (this: GlobalEventHandlers, ev: Event) => any;
    onerror: OnErrorEventHandlerNonNull;
    onfocus: (this: GlobalEventHandlers, ev: FocusEvent) => any;
    ongotpointercapture: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    oninput: (this: GlobalEventHandlers, ev: Event) => any;
    oninvalid: (this: GlobalEventHandlers, ev: Event) => any;
    onkeydown: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onkeypress: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onkeyup: (this: GlobalEventHandlers, ev: KeyboardEvent) => any;
    onload: (this: GlobalEventHandlers, ev: Event) => any;
    onloadeddata: (this: GlobalEventHandlers, ev: Event) => any;
    onloadedmetadata: (this: GlobalEventHandlers, ev: Event) => any;
    onloadstart: (this: GlobalEventHandlers, ev: Event) => any;
    onlostpointercapture: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onmousedown: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseenter: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseleave: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmousemove: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseout: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseover: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onmouseup: (this: GlobalEventHandlers, ev: MouseEvent) => any;
    onpause: (this: GlobalEventHandlers, ev: Event) => any;
    onplay: (this: GlobalEventHandlers, ev: Event) => any;
    onplaying: (this: GlobalEventHandlers, ev: Event) => any;
    onpointercancel: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerdown: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerenter: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerleave: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointermove: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerout: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerover: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onpointerup: (this: GlobalEventHandlers, ev: PointerEvent) => any;
    onprogress: (this: GlobalEventHandlers, ev: ProgressEvent<EventTarget>) => any;
    onratechange: (this: GlobalEventHandlers, ev: Event) => any;
    onreset: (this: GlobalEventHandlers, ev: Event) => any;
    onresize: (this: GlobalEventHandlers, ev: UIEvent) => any;
    onscroll: (this: GlobalEventHandlers, ev: Event) => any;
    onsecuritypolicyviolation: (this: GlobalEventHandlers, ev: SecurityPolicyViolationEvent) => any;
    onseeked: (this: GlobalEventHandlers, ev: Event) => any;
    onseeking: (this: GlobalEventHandlers, ev: Event) => any;
    onselect: (this: GlobalEventHandlers, ev: Event) => any;
    onselectionchange: (this: GlobalEventHandlers, ev: Event) => any;
    onselectstart: (this: GlobalEventHandlers, ev: Event) => any;
    onstalled: (this: GlobalEventHandlers, ev: Event) => any;
    onsubmit: (this: GlobalEventHandlers, ev: Event) => any;
    onsuspend: (this: GlobalEventHandlers, ev: Event) => any;
    ontimeupdate: (this: GlobalEventHandlers, ev: Event) => any;
    ontoggle: (this: GlobalEventHandlers, ev: Event) => any;
    ontouchcancel?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchend?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchmove?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontouchstart?: (this: GlobalEventHandlers, ev: TouchEvent) => any;
    ontransitioncancel: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionend: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionrun: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    ontransitionstart: (this: GlobalEventHandlers, ev: TransitionEvent) => any;
    onvolumechange: (this: GlobalEventHandlers, ev: Event) => any;
    onwaiting: (this: GlobalEventHandlers, ev: Event) => any;
    onwheel: (this: GlobalEventHandlers, ev: WheelEvent) => any;
    append(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    prepend(...nodes: (string | Node)[]): void { throw new Error("Method not implemented."); }
    querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K];
    querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K];
    querySelector<E extends Element = Element>(selectors: string): E;
    querySelector(selectors: any) { throw new Error("Method not implemented."); }
    querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
    querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>;
    querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
    querySelectorAll(selectors: any) { throw new Error("Method not implemented."); return null; }
    createExpression(expression: string, resolver?: XPathNSResolver): XPathExpression { throw new Error("Method not implemented."); }
    createNSResolver(nodeResolver: Node): XPathNSResolver { throw new Error("Method not implemented."); }
    evaluate(expression: string, contextNode: Node, resolver?: XPathNSResolver, type?: number, result?: XPathResult): XPathResult { throw new Error("Method not implemented."); }

}
