const PROMPT = `
Extract ONLY the following fields from the provided certificate image or PDF and return VALID JSON ONLY.
DO NOT add any text, explanation, comments, or code fences — the response must be a single JSON object and nothing else.

Required JSON shape (keys must appear exactly as shown):
{
  "certificateNo": "",
  "dateofIssue": "",
  "name": "",
  "enrolmentNo": "",
  "graduationYear": "",
  "degree": ""
}

RULES & GUIDELINES:
1) Return ONLY the JSON object with the six keys above. Do not return extra keys or metadata.
2) If a field is missing or unreadable, set its value to an empty string "" (still include the key).
3) All values must be strings (use empty string "" when unknown).
4) Trim surrounding whitespace from all values. Remove obvious OCR garbage (repeated non-alphanumeric characters like "-----" or "####").
5) If multiple candidate values are present (e.g., several numbers that could be certificateNo), choose the most prominent/likely one on the certificate (largest font, labeled, or near labels like "Certificate No", "Reg. No", "Serial No", "No.").
6) Date handling:
   - Try to parse and **normalize** the date to ISO format YYYY-MM-DD if possible.
   - Accept common formats found on certificates: "DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "D MMM YYYY" (e.g., "5 Mar 2024"), "Month D, YYYY", etc.
   - If normalization is not confidently possible, return the date string as it appears (trimmed) — but still put it in the "dateofIssue" field (string).
7) Graduation year:
   - Return a 4-digit year if clearly present (e.g., "2024").
   - If only a month/year is present, extract the year.
   - If unclear, return "".
8) Names and degree:
   - For "name" return the full student name exactly as printed, preserving capitalization and diacritics.
   - For "degree" return the degree text (e.g., "B.Tech", "M.Sc.", "M.Tech", "BA", "MBA" ).
9) Enrollment / roll numbers:
   - For "enrolmentNo" return the exact enrollment or roll number text as printed (do not add or remove leading zeros unless clearly an OCR error).
10) PDFs / multi-page inputs:
   - If multiple pages exist, examine the page that appears to contain the certificate main body (title, seals, large text). Choose values from the primary certificate page.
11) No hallucination:
   - If a field cannot be read from the image/PDF, do NOT guess — return "".
12) Language / script:
   - If the certificate is in another language or script, return the field text as it appears (preserve script). Do not translate.
13) OCR robustness:
   - Strip obvious OCR artifacts (like stray characters adjacent to numbers or dates) but preserve the meaningful content.
14) Formatting constraints:
   - Use double quotes for keys and string values.
   - The JSON object must be syntactically valid (parseable by a strict JSON parser).
15) Examples (for reference only — do not include in output):
   - If certificate number is "Cert No: 12345/AB", return { "certificateNo": "12345/AB", ... }
   - If date on certificate is "5 March 2024", prefer "2024-03-05" for dateofIssue when parseable.

FINAL NOTE: The output MUST be exactly one JSON object with the keys in any order but present. Example valid output:
{"certificateNo":"12345","dateofIssue":"2024-03-05","name":"A. Student","enrolmentNo":"ENR2024001","graduationYear":"2024","degree":"B.Tech"}
`;

export default PROMPT;
