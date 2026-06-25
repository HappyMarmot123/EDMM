export const HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT = String.raw`
(() => {
  const blockedNames = new Set(["bis_skin_checked", "bis_register"]);
  const blockedPrefix = "__processed_";

  const shouldRemove = (name) =>
    blockedNames.has(name) || name.startsWith(blockedPrefix);

  const stripElement = (element) => {
    if (!element || !element.attributes) return;

    for (const attribute of Array.from(element.attributes)) {
      if (shouldRemove(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  };

  const stripTree = (root) => {
    if (!root) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      stripElement(root);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      stripElement(node);
      node = walker.nextNode();
    }
  };

  stripTree(document.documentElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const name = mutation.attributeName;
        if (name && shouldRemove(name)) {
          mutation.target.removeAttribute(name);
        }
      }

      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          stripTree(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener(
    "load",
    () => {
      stripTree(document.documentElement);
      setTimeout(() => observer.disconnect(), 1000);
    },
    { once: true }
  );
})();
`;
