const { createHash } = require("crypto");
const axios = require("axios");

const { env } = require("../config/env");

const recentDuplicateCache = new Map();

function isJiraConfigured() {
  return Boolean(env.jiraBaseUrl && env.jiraEmail && env.jiraApiToken && env.jiraProjectKey);
}

function createParagraph(text) {
  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

function createLinkParagraph(text, href) {
  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text,
        marks: [
          {
            type: "link",
            attrs: {
              href
            }
          }
        ]
      }
    ]
  };
}

function createHeading(text, level = 3) {
  return {
    type: "heading",
    attrs: { level },
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

function createRule() {
  return {
    type: "rule"
  };
}

function createBulletList(items) {
  return {
    type: "bulletList",
    content: items.filter(Boolean).map((item) => ({
      type: "listItem",
      content: [createParagraph(item)]
    }))
  };
}

function createAuthConfig() {
  return {
    auth: {
      username: env.jiraEmail,
      password: env.jiraApiToken
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  };
}

function createAdfDocument(lines) {
  return {
    version: 1,
    type: "doc",
    content: lines.filter(Boolean).map((item) => (typeof item === "string" ? createParagraph(item) : item))
  };
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function truncateText(value, maxLength) {
  const normalized = normalizeText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function getPreview(message) {
  return truncateText(message, 60);
}

function getComplaintCategory(message) {
  const normalized = message.toLowerCase();

  if (/(төлбөр|payment|charge|refund|money|мөнгө|торгууль)/.test(normalized)) {
    return "Payment";
  }

  if (/(app|апп|system|систем|алдаа|bug|ажиллахгүй|bolohgui|error)/.test(normalized)) {
    return "App";
  }

  if (/(operator|staff|ajiltan|үйлчилгээ|service|support)/.test(normalized)) {
    return "Service";
  }

  return "General";
}

function getComplaintCategoryLabel(category) {
  const mapping = {
    Payment: "Төлбөр",
    App: "Систем",
    Service: "Үйлчилгээ",
    General: "Гомдол"
  };

  return mapping[category] || "Гомдол";
}

function extractComplaintLocation(message) {
  const normalized = normalizeText(message);
  const patterns = [
    /([A-Za-zА-Яа-яӨөҮү0-9-]+(?:\s+[A-Za-zА-Яа-яӨөҮү0-9-]+){0,3}\s+центрийн\s+зогсоол(?:оос|д|ын|)?)/iu,
    /([A-Za-zА-Яа-яӨөҮү0-9-]+(?:\s+[A-Za-zА-Яа-яӨөҮү0-9-]+){0,3}\s+төвийн\s+зогсоол(?:оос|д|ын|)?)/iu,
    /([A-Za-zА-Яа-яӨөҮү0-9-]+(?:\s+[A-Za-zА-Яа-яӨөҮү0-9-]+){0,3}\s+parking)/iu,
    /([A-Za-zА-Яа-яӨөҮү0-9-]+(?:\s+[A-Za-zА-Яа-яӨөҮү0-9-]+){0,3}\s+зогсоол(?:оос|д|ын|)?)/iu
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match) {
      return normalizeText(match[1]);
    }
  }

  return "";
}

function compactLocation(location) {
  return normalizeText(location)
    .replace(/^\d{4}\s?[A-Za-zА-Яа-яӨөҮү]{3}\s+/u, "")
    .replace(/ийн\s+зогсоол(?:оос|д|ын)?$/iu, "")
    .replace(/төвийн\s+зогсоол(?:оос|д|ын)?$/iu, "төв")
    .replace(/центрийн\s+зогсоол(?:оос|д|ын)?$/iu, "центр")
    .replace(/\s+зогсоол(?:оос|д|ын)?$/iu, "")
    .replace(/гийн$/iu, "")
    .replace(/ын$/iu, "")
    .replace(/ийн$/iu, "")
    .replace(/г$/iu, "");
}

function extractComplaintHighlights(message) {
  const normalized = normalizeText(message).toLowerCase();
  const highlights = [];

  if (/(буруу\s*тан|дугаар.*буруу|номер.*буруу|танин)/iu.test(normalized)) {
    highlights.push("Буруу танилт");
  }

  if (/(илүү\s*цаг|нэмэлт\s*цаг|төлбөр|ebarimt|ebarimt|баримт)/iu.test(normalized)) {
    highlights.push("Төлбөр");
  }

  if (/(цаг\s*нь\s*зогсохгүй|цаг\s*зогсохгүй|хугацаа\s*зогсохгүй|гүйгээд\s*байна)/iu.test(normalized)) {
    highlights.push("Цаг зогсохгүй");
  }

  if (/(утсаа\s*авахгүй|холбогдохгүй|хариуцах\s*хүн|ажилтан.*авахгүй)/iu.test(normalized)) {
    highlights.push("Холбогдохгүй");
  }

  if (/(ажиллахгүй|алдаа|error|bug|систем)/iu.test(normalized)) {
    highlights.push("Алдаа");
  }

  return highlights.slice(0, 2);
}

function buildComplaintSummaryBody(ticket) {
  const parts = [];
  const category = getComplaintCategory(ticket.complaint);
  const highlights = extractComplaintHighlights(ticket.complaint);
  const location = compactLocation(extractComplaintLocation(ticket.complaint));

  parts.push(getComplaintCategoryLabel(category));

  if (ticket.plate) {
    parts.push(ticket.plate);
  }

  if (highlights.length > 0) {
    const preferredHighlight = highlights.find((item) => item === "Цаг зогсохгүй")
      || highlights.find((item) => item !== getComplaintCategoryLabel(category) && item !== category)
      || highlights[0];
    const primaryHighlight = preferredHighlight;
    if (primaryHighlight && primaryHighlight !== getComplaintCategoryLabel(category)) {
      parts.push(primaryHighlight);
    }
  }

  if (location) {
    parts.push(location);
  }

  if (parts.length === 0) {
    return truncateText(getPreview(ticket.complaint), 70);
  }

  return truncateText(parts.join(" | "), 70);
}

function normalizeFingerprintText(value) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function buildDuplicateFingerprint(parts) {
  return createHash("sha256")
    .update(parts.map(normalizeFingerprintText).join("|"))
    .digest("hex")
    .slice(0, 12);
}

function buildDuplicateLabel(fingerprint) {
  return `dedupe-${fingerprint}`;
}

function getDuplicateCutoffTime() {
  return Date.now() - env.jiraDuplicateWindowMinutes * 60 * 1000;
}

function getRecentDuplicateFromCache(fingerprint) {
  const cached = recentDuplicateCache.get(fingerprint);

  if (!cached) {
    return null;
  }

  if (cached.createdAtMs < getDuplicateCutoffTime()) {
    recentDuplicateCache.delete(fingerprint);
    return null;
  }

  return cached;
}

function rememberRecentDuplicate(fingerprint, issueKey) {
  recentDuplicateCache.set(fingerprint, {
    issueKey,
    createdAtMs: Date.now()
  });
}

async function searchRecentDuplicateIssue(duplicateLabel) {
  const response = await axios.get(
    `${env.jiraBaseUrl}/rest/api/3/search/jql`,
    {
      ...createAuthConfig(),
      params: {
        jql: `project = ${env.jiraProjectKey} AND labels = \"${duplicateLabel}\" AND created >= -${env.jiraDuplicateWindowMinutes}m ORDER BY created DESC`,
        maxResults: 1,
        fields: ["key"]
      }
    }
  );

  return response.data.issues?.[0] || null;
}

async function addIssueComment(issueKey, lines) {
  await axios.post(
    `${env.jiraBaseUrl}/rest/api/3/issue/${issueKey}/comment`,
    {
      body: createAdfDocument(lines)
    },
    createAuthConfig()
  );
}

function buildComplaintSummary(ticket) {
  return buildComplaintSummaryBody(ticket);
}

function buildFeedbackSummary(ticket) {
  return `Санал | ${truncateText(ticket.feedback, 60)}`;
}

function buildComplaintDescriptionBlocks(ticket, category) {
  return [
    createHeading("Overview"),
    createBulletList([
      `Type: Complaint`,
      `Category: ${category}`,
      `Channel: Messenger`,
      `Request ID: ${ticket.requestId}`,
      `Created At: ${ticket.createdAt}`
    ]),
    createRule(),
    createHeading("Reporter"),
    createBulletList([
      `Plate: ${ticket.plate}`,
      `Phone: ${ticket.phone}`
    ]),
    ticket.imageUrl ? createRule() : null,
    ticket.imageUrl ? createHeading("Attachment") : null,
    ticket.imageUrl ? createLinkParagraph("Зураг нээх", ticket.imageUrl) : null,
    createRule(),
    createHeading("Summary"),
    getPreview(ticket.complaint),
    createRule(),
    createHeading("Details"),
    ticket.complaint
  ];
}

function buildFeedbackDescriptionBlocks(ticket) {
  return [
    createHeading("Overview"),
    createBulletList([
      `Type: Feedback`,
      `Channel: Messenger`,
      `Request ID: ${ticket.requestId}`,
      `Created At: ${ticket.createdAt}`
    ]),
    createRule(),
    createHeading("Summary"),
    getPreview(ticket.feedback),
    createRule(),
    createHeading("Details"),
    ticket.feedback
  ];
}

async function createJiraIssue({ summary, issueType, lines, labels, priority }) {
  if (!isJiraConfigured()) {
    throw new Error("Jira configuration is incomplete.");
  }

  const duplicateFingerprint = arguments[0].duplicateFingerprint;
  const duplicateCommentLines = arguments[0].duplicateCommentLines || [];

  if (duplicateFingerprint) {
    const cachedIssue = getRecentDuplicateFromCache(duplicateFingerprint);

    if (cachedIssue) {
      await addIssueComment(cachedIssue.issueKey, duplicateCommentLines);

      return {
        key: cachedIssue.issueKey,
        deduplicated: true
      };
    }

    const duplicateLabel = buildDuplicateLabel(duplicateFingerprint);
    const existingIssue = await searchRecentDuplicateIssue(duplicateLabel);

    if (existingIssue) {
      rememberRecentDuplicate(duplicateFingerprint, existingIssue.key);
      await addIssueComment(existingIssue.key, duplicateCommentLines);

      return {
        key: existingIssue.key,
        deduplicated: true
      };
    }
  }

  const fields = {
    project: { key: env.jiraProjectKey },
    summary,
    issuetype: { name: issueType },
    description: createAdfDocument(lines)
  };

  if (Array.isArray(labels) && labels.length > 0) {
    fields.labels = labels;
  }

  if (priority) {
    fields.priority = { name: priority };
  }

  const response = await axios.post(
    `${env.jiraBaseUrl}/rest/api/3/issue`,
    {
      fields
    },
    createAuthConfig()
  );

  if (duplicateFingerprint) {
    rememberRecentDuplicate(duplicateFingerprint, response.data.key);
  }

  return {
    ...response.data,
    deduplicated: false
  };
}

async function createComplaintIssue(ticket) {
  const category = getComplaintCategory(ticket.complaint);
  const duplicateFingerprint = buildDuplicateFingerprint([ticket.phone, ticket.complaint]);
  const duplicateLabel = buildDuplicateLabel(duplicateFingerprint);

  return createJiraIssue({
    summary: buildComplaintSummary(ticket),
    issueType: env.jiraComplaintIssueType,
    priority: env.jiraComplaintPriority,
    labels: [...env.jiraComplaintLabels, `category-${category.toLowerCase()}`, duplicateLabel],
    duplicateFingerprint,
    duplicateCommentLines: [
      "Duplicate chatbot complaint merged",
      `Merged At: ${new Date().toISOString()}`,
      `Request ID: ${ticket.requestId}`,
      `Phone: ${ticket.phone}`,
      "Details:",
      ticket.complaint
    ],
    lines: buildComplaintDescriptionBlocks(ticket, category)
  });
}

async function createFeedbackIssue(ticket) {
  const duplicateFingerprint = buildDuplicateFingerprint([ticket.feedback]);
  const duplicateLabel = buildDuplicateLabel(duplicateFingerprint);

  return createJiraIssue({
    summary: buildFeedbackSummary(ticket),
    issueType: env.jiraFeedbackIssueType,
    priority: env.jiraFeedbackPriority,
    labels: [...env.jiraFeedbackLabels, duplicateLabel],
    duplicateFingerprint,
    duplicateCommentLines: [
      "Duplicate chatbot feedback merged",
      `Merged At: ${new Date().toISOString()}`,
      `Request ID: ${ticket.requestId}`,
      "Details:",
      ticket.feedback
    ],
    lines: buildFeedbackDescriptionBlocks(ticket)
  });
}

module.exports = {
  isJiraConfigured,
  createComplaintIssue,
  createFeedbackIssue
};