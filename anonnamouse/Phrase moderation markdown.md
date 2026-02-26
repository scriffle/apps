# Client-side JavaScript algorithms for classroom content moderation

**The most effective browser-based content moderation systems combine a fast multi-layer pipeline — blocklist lookup, regex with leet-speak normalization, fuzzy/phonetic matching, and optional in-browser ML — into a weighted scoring system that flags content for teacher review rather than silently blocking it.** No single technique handles all four detection categories (profanity, bullying, self-harm, divisive content), and the difficulty scales dramatically: profanity detection is largely a solved problem with existing libraries, while detecting bullying, self-harm signals, and inflammatory content remains an open challenge even for state-of-the-art ML models. The practical path forward is a defense-in-depth architecture where fast client-side heuristics catch the obvious cases, in-browser ML models handle semantic analysis, and optional API calls resolve ambiguous content — all calibrated with age-appropriate thresholds and complemented by human oversight.

One critical development: **Google's Perspective API is sunsetting on December 31, 2026**, making client-side capabilities and alternative APIs more important than ever.

---

## The normalization pipeline that defeats obfuscation

The single most important architectural decision is building a robust **text normalization pipeline** that runs before any matching. Students will substitute characters ("sh1t", "f@ck", "a$$"), insert separators ("f.u.c.k"), double characters ("fuuuuck"), use Unicode homoglyphs (Cyrillic "а" for Latin "a"), and embed zero-width invisible characters. A 2025 arXiv study found that homoglyph and zero-width character attacks achieved **44–76% success rates** against production moderation systems lacking normalization.

The recommended normalization sequence processes input through four stages before any detection runs:

**Stage 1 — Unicode normalization and homoglyph resolution.** Apply `String.prototype.normalize('NFKD')` to decompose characters, then strip combining diacritical marks with `/[\u0300-\u036f]/g`. This converts "fück" → "fuck" and resolves fullwidth characters. For homoglyphs, map visually identical Unicode characters (Cyrillic, Greek, mathematical symbols) to ASCII equivalents using the official Unicode confusables table. Strip zero-width characters (`/[\u200B\u200C\u200D\uFEFF\u180E]/g`) and directional overrides.

**Stage 2 — Leet speak decoding.** Apply a character substitution map: `0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s, !→i, |→l, +→t`. Process multi-character substitutions first (`ph→f`). This transforms "h4t3" → "hate" and "$h1t" → "shit".

**Stage 3 — Separator removal.** Strip non-alphanumeric characters inserted between word characters: "f.u.c.k" → "fuck". Use a regex that only removes separators *between* alphabetic characters to avoid false concatenation: `(?<=\w)[.\-_|*\s](?=\w)`.

**Stage 4 — Repeated character collapse.** Reduce runs of 3+ identical characters to 2: "fuuuuuck" → "fuuck". Using `/(.)\\1{2,}/g` replaced with `$1$1` preserves legitimate doubled letters (like "ll" in "hello") while normalizing deliberate repetition.

This four-stage pipeline runs in **under 1ms** for typical student input. The `obscenity` npm library implements this exact approach through its "transformer" pipeline (text preprocessors, not neural transformers), and its `RegExpMatcher` with these transformers automatically matches "fuuuuuuuckkk", "ʃṳ𝒸𝗄", and "wordsbeforefuckandafter" from a single pattern definition for "fuck".

---

## Lexicon matching, fuzzy algorithms, and phonetic detection

After normalization, the detection layer applies multiple matching strategies in parallel, each contributing a weighted score.

**Dictionary/blocklist lookup** is the fastest layer: tokenize input, check each token against a `Set` of banned words. With a `Set`, lookup is **O(1) per word** — under 0.001ms. For word lists, the `cuss` npm package provides the highest-quality curated data: **~1,770 English words** with "sureness" ratings from 0 (often innocent, like "beaver") to 2 (almost always profane). The Shutterstock "List of Dirty, Naughty, Obscene, and Otherwise Bad Words" on GitHub is another widely-used source. Apply a Porter Stemmer before lookup to catch morphological variants — "hating" stems to "hate", "fuckers" to a matchable root. The reference JavaScript Porter Stemmer implementation processes **23,000 words in ~11ms** on modest hardware.

**Fuzzy matching via Levenshtein distance** catches misspellings that survive normalization. The `fastest-levenshtein` npm library achieves ~78,000 operations/second using int32 bit manipulation optimized for short strings. For a dictionary of ~400 profane words (all short, typically 3–8 characters), comparing every input token takes negligible time. A threshold of **edit distance ≤ 2** for words of 5+ characters catches most deliberate misspellings while limiting false positives.

**Jaro-Winkler similarity** complements Levenshtein with its prefix-weighted scoring (0 to 1). The Winkler modification boosts scores for strings sharing a common prefix, matching how users tend to keep word beginnings intact while mangling middles. A threshold of **0.85–0.90** works well for profanity matching.

**Phonetic algorithms** catch sound-alike evasions. Double Metaphone (Lawrence Philips, 2000) returns both primary and secondary phonetic codes, handling pronunciation ambiguities across English word origins. "Smith" → [SM0, XMT] and "Schmidt" → [XMT, SMT] share a code. For content moderation, "phuck" produces the same phonetic code as the target word. The `double-metaphone` npm package is ESM-compatible and browser-ready. All phonetic algorithms are **O(n) for word length** — extremely fast.

**Regex pattern matching** with dynamic character substitution generates comprehensive patterns from base words. For each word, replace characters with alternation groups (`a → (a|4|@|\*)`, `s → (s|$|5|z)`, `e → (e|3)`), add morphological suffixes (`(a|e|ed|er|ing?)?s?`), and wrap in word boundaries. Pre-compile these patterns once at initialization. The key risk is catastrophic backtracking with complex alternation chains — keep patterns focused and test with worst-case inputs.

**N-gram analysis** provides a complementary signal. Character trigrams ("hat" → {hat, ate}) capture sub-word patterns that survive some obfuscation. Comparing trigram overlap between input tokens and known toxic words using the overlap coefficient (`|intersection| / |smaller set|`) yields a similarity score useful for catching novel evasion attempts. Word-level n-grams (bigrams and trigrams) capture toxic multi-word phrases like "kill yourself" or "go die" that individual word matching misses entirely.

---

## In-browser ML models and NLP libraries

For detecting semantic toxicity beyond keyword matching — bullying undertones, implicit threats, hostile intent — JavaScript offers several viable paths.

**TensorFlow.js toxicity model** (`@tensorflow-models/toxicity`) is the most established in-browser toxicity classifier. Built on the Universal Sentence Encoder, it classifies text into **7 categories**: toxicity, severe_toxicity, identity_attack, insult, obscene, sexually_explicit, and threat. Trained on ~2 million comments from the Civil Comments dataset, it achieves **~30ms inference** on a 2018 MacBook Pro after model loading. The model is approximately **25MB** and can be cached in IndexedDB for instant subsequent loads. However, Google explicitly notes these are "highly experimental" with lower accuracy and greater ML bias than server-side alternatives. The configurable confidence threshold (default 0.85) returns `true`, `false`, or `null` when confidence is insufficient.

**Transformers.js with toxic-bert** (`@xenova/transformers` + `Xenova/toxic-bert`) is a newer, more accurate alternative using Hugging Face's ONNX Runtime Web backend. It detects similar categories (toxicity, severe_toxicity, obscene, threat, insult, identity_attack) with BERT-level accuracy. The tradeoff is size: **~111MB download**, though it's cached after first load. Inference is typically under 500ms on mid-range devices. For a classroom setting where the application loads once per session, this one-time download cost may be acceptable.

For lightweight NLP processing, three libraries stand out:

- **wink-nlp** delivers the best performance: **650,000 tokens/second** with zero dependencies, providing tokenization, POS tagging (~95% accuracy), sentiment analysis (F-score ~84.5%), and named entity recognition. Its `wink-eng-lite-web-model` runs in browsers including low-end smartphones. At ~2-3MB total, it's the best choice for real-time keystroke analysis.

- **compromise.js** (~180KB) processes text at keypress speed with rule-based POS tagging, entity recognition, and powerful pattern matching via `.match()` and `.has()`. Its POS tagging enables detecting imperative threat structures ("kill yourself" as verb + pronoun patterns). No built-in sentiment analysis, but excellent for structural text analysis.

- **natural** (NaturalNode) provides the broadest toolkit: Naive Bayes and Logistic Regression classifiers (trainable on custom toxic/non-toxic datasets), AFINN-165 sentiment analysis with negation handling, TF-IDF, all phonetic algorithms, and string similarity measures. It's primarily Node.js-focused and heavy for browser bundles, but individual modules can be imported selectively.

For sentiment scoring specifically, the `sentiment` npm package using AFINN-165 achieves **~861,000 operations/second** with emoji support. It returns a comparative score (sum of token scores divided by token count) that directly indicates hostility level.

**Critical browser deployment considerations:** Always run ML inference in a **Web Worker** to prevent UI blocking. The WASM backend is preferred over WebGL for text models — it offers consistent precision across devices, works well in workers (no GPU contention), and performs comparably to WebGL for smaller models. Cache models aggressively using IndexedDB (`model.save('indexeddb://toxicity-model')`) and Service Workers. Use `requestIdleCallback()` to preload models after the page becomes interactive. Always call `tf.tidy()` to prevent tensor memory leaks.

---

## Open-source JavaScript moderation libraries compared

The ecosystem has matured significantly, with clear leaders for different use cases.

**`obscenity`** is the most technically sophisticated pure-JS profanity filter. Its transformer pipeline handles leet speak, Unicode confusables, repeated characters, and embedded words automatically from single pattern definitions. It offers strong false-positive prevention through whitelisting and configurable word boundaries. Actively maintained (v0.4.6, February 2026), with TypeScript-first design and ~210KB bundle size. **Recommended for projects requiring robust evasion resistance.**

**`@2toad/profanity`** (v3.2.0, September 2025) offers the best balance of features and simplicity. TypeScript-first with zero runtime dependencies, it supports multiple languages via LibreTranslate, Unicode-aware word boundaries, configurable whole-word matching (preventing the Scunthorpe problem by default), whitelist support, and multiple censoring strategies. **~63,000 weekly npm downloads** make it the most-used actively-maintained option.

**`bad-words`** remains the most downloaded (~120,000 weekly) but is effectively legacy — minimal changes since 2020, unmerged PRs dating to 2022, poor obfuscation handling, and no whitelist by default. Not recommended for new projects.

**`cuss`** / **`profanities`** provides the best-quality word list data: ~1,770 English words with sureness ratings across 7 languages (Arabic-Latin, Spanish, French, Italian, Portuguese). It's explicitly a data package, not a filter — ideal as a foundation for custom implementations.

**`glin-profanity`** (v3.3.0) is the most ambitious newer entry, combining dictionary matching across 23 languages, three-level leet speak detection, Unicode normalization, and optional TensorFlow.js toxicity model integration. It claims **21M+ operations/second** for simple checks and 85% false positive reduction. However, it has limited community validation — impressive claims that need independent verification.

**`allprofanity`** takes a novel algorithmic approach using **Aho-Corasick multi-pattern matching** and **Bloom filters** for fast probabilistic lookups, claiming 664% faster performance than regex on large texts. It covers 3,600+ entries across 9 languages with severity scoring (MILD through EXTREME). Very new and unproven at scale.

**No education-specific open-source JavaScript library exists.** Commercial platforms like GoGuardian, Lightspeed Systems, and Padlet for Schools implement proprietary moderation, but the open-source ecosystem has a clear gap for classroom-focused tools with age-appropriate word lists, COPPA/FERPA compliance tooling, or teacher-controlled sensitivity settings.

---

## Multi-layer pipeline architecture and scoring

The recommended architecture chains detection layers from fastest/cheapest to slowest/most accurate, with short-circuit evaluation:

**Layer 1 — Blocklist lookup** (<1ms): Normalized tokens checked against a `Set`. Perfect accuracy for known words with zero context understanding. Short-circuit on exact match of severe terms.

**Layer 2 — Regex patterns** (<1ms): Pre-compiled patterns with character substitution catch structured evasion. Short-circuit on high-confidence regex match.

**Layer 3 — Fuzzy and phonetic matching** (1–5ms): Levenshtein distance and Double Metaphone catch remaining misspellings and sound-alikes.

**Layer 4 — Client-side ML** (20–50ms): TF.js toxicity model or wink-nlp sentiment analysis handles semantic detection — hostile intent, implicit insults, threats without explicit keywords.

**Layer 5 — External API** (50–200ms): Only for ambiguous cases where client-side confidence falls in the "uncertain zone" (roughly 0.4–0.9 score range).

**Layer 6 — Teacher review queue**: Content that automated systems cannot confidently classify.

Each layer produces a score. The aggregation strategy should vary by category: use **max-of scoring** (most conservative) for safety-critical categories like threats and self-harm — a single strong signal from any layer triggers action. Use **weighted averaging** for general toxicity to balance user experience. Apply an **agreement bonus** (10–20% score boost) when 3+ layers independently flag content, as convergent signals indicate higher confidence.

For classroom deployment, implement a **multi-threshold action framework** with per-category overrides. Threats and self-harm references should trigger at low thresholds (0.3–0.5) because false negatives carry disproportionate risk. Profanity can use higher thresholds (0.8–0.95) since consequences of false negatives are lower. Between thresholds, flag content for teacher review rather than blocking — this preserves educational flow while maintaining safety.

**Performance engineering** matters for real-time use. Throttle client-side checks at 100–200ms intervals during typing. Debounce ML inference at 300–500ms (analyze on pause, not every keystroke). Debounce API calls at 500–1000ms. Lazy-load the ML model using `requestIdleCallback()` after page load, and cache it in IndexedDB. All lightweight detection layers (1–3) should complete in **under 5ms total** for typical student input under 500 characters.

---

## API enhancements beyond the sunsetting Perspective API

**Google Perspective API** has been the gold standard for toxicity scoring, detecting 8 production attributes (TOXICITY, SEVERE_TOXICITY, IDENTITY_ATTACK, INSULT, PROFANITY, THREAT, SEXUALLY_EXPLICIT, FLIRTATION) across 7+ languages for free at 1 QPS. However, **Google announced it will sunset on December 31, 2026**, with quota requests only processed until February 2026. This makes planning for alternatives essential.

**OpenAI Moderation API** is the strongest free replacement. It's completely free (doesn't count toward usage limits), detects **11 categories** including harassment, hate, self-harm (with sub-categories for intent and instructions), sexual content, and violence using the GPT-4o-based `omni-moderation-latest` model. It supports text and images, with a 32,768-token input limit. The main limitation is rate limits — default rates are low for free-tier accounts (~3 RPM for new accounts), increasing with paid tier.

**ModerateHatespeech API** is notable for classroom use: completely free, operated by a nonprofit, claims **98% accuracy** for hate speech flagging, does not log or store submitted data (addressing privacy concerns), and returns simple flag/normal classifications with confidence scores. It's English-focused and conservative (focuses on personal attacks and explicitly hateful content).

**Azure Content Safety** offers a **free tier of 5,000 text analyses per month** with multi-level severity scores (Safe/Low/Medium/High) for Hate, Violence, Sexual, and Self-harm categories across 100+ languages. It explicitly supports K-12 education use cases and uniquely offers custom category training.

The **client-first architecture** should route content to APIs only when client-side confidence is ambiguous. Cache API results for common phrases using an LRU cache with TTL (1-hour expiry, 1,000-entry limit). Implement a circuit breaker pattern — after N consecutive API failures, fall back to client-side-only with stricter thresholds. Never send student PII to external APIs; if API calls are needed, send only the text content stripped of identifying metadata.

---

## Detection realities across the four content categories

The four required detection categories vary enormously in tractability.

**Profanity and slurs** is largely solved by the lexicon + normalization + fuzzy matching pipeline described above. Existing libraries like `obscenity` handle the vast majority of cases. The main challenge is the evasion arms race and maintaining current word lists. Achievable accuracy with a well-tuned client-side pipeline: **90–95%** for English profanity.

**Bullying and personal attacks** are substantially harder. A PMC study (Hee et al., 2018) found that profanity-based baselines perform poorly for bullying detection because bullying often uses ordinary language ("Nice shirt... again") and "socially acceptable" insults between friends must be distinguished from actual attacks. Behavioral patterns (repeated targeting of the same person) matter more than individual messages, but **client-side JS cannot track cross-session behavioral patterns** without server-side storage. The TF.js toxicity model's "insult" category provides a starting point. Heuristic rules can detect ALL CAPS aggression (flag when uppercase ratio exceeds 70% in messages over 5 characters), excessive punctuation (3+ consecutive exclamation/question marks), and threatening sentence structures ("I will" + violent verb, "you better" + consequence, imperative + self-harm verb). But subtle bullying remains beyond client-side detection.

**Self-harm and violence** detection is critical for student safety but technically very challenging. Messages often contain vague references and indirect clues ("I don't want to be here anymore"). The TF.js toxicity model covers "threat" but not self-harm specifically. On Twitter/X, a study found only **8.3% of self-harm tweets were caught** by content moderation. Students in self-harm communities actively use evasion terms ("unalive" for suicide, "shtwt" for self-harm Twitter). False positives carry their own harm — flagging students may stigmatize them and discourage help-seeking. The best client-side approach combines keyword lists of known self-harm terms (including algospeak variants like "unalive", "seggs", "grape") with sentiment analysis and escalation to the OpenAI Moderation API, which has dedicated self-harm categories including `self-harm/intent` and `self-harm/instructions`.

**Divisive, political, and inflammatory content** is the hardest category by far, and arguably unsuitable for automated detection. Political speech uses normal vocabulary, "inflammatory" is inherently subjective and culturally dependent, and filters that target political keywords routinely block anti-extremism content alongside extremist content. No JavaScript library or API specifically targets this category. Perspective API's experimental "INFLAMMATORY" attribute (English-only, trained on NYT data) was the closest available tool, and it's sunsetting. The pragmatic approach is to focus automated systems on the other three categories and rely on teacher oversight for inflammatory content, perhaps with a simple flagging mechanism when sentiment analysis detects extremely negative or emotionally charged language.

---

## The Scunthorpe problem and the evasion arms race

The tension between catching obfuscation and avoiding false positives is irreducible. Enabling substring matching catches "fuckthis" but also blocks "Scunthorpe" (which contains "cunt"), "assassin" (contains "ass" twice), "Cockburn" (a common surname), and "cum laude" (on résumés). The "clbuttic" error — where "classic" becomes "clbuttic" when "ass" is replaced with "butt" — became an internet meme for this exact failure mode. In 2021, Facebook removed the official page of **Bitche**, a French town, and flagged **Plymouth Hoe**, a famous English landmark.

The best mitigation combines **whole-word matching by default** (as `@2toad/profanity` does), **explicit whitelists** of innocent words containing profane substrings ("classic", "assassin", "Scunthorpe", "assume", "basement"), and **context analysis** where ML-based sentiment scoring distinguishes offensive usage from innocent occurrences. The `obscenity` library's documentation is refreshingly honest: "As with all swear filters, Obscenity is not perfect (nor will it ever be). Use its output as a heuristic, and not as the sole judge."

For classroom settings specifically, academic vocabulary creates additional challenges. A filter blocking "kill", "murder", "slave", or "suicide" makes it impossible to teach the Holocaust, Shakespeare, To Kill a Mockingbird, or mental health topics. The recommended approach is **teacher-controlled bypass** — educators can temporarily adjust filter sensitivity for specific lessons — combined with **flagging rather than blocking**, where content is surfaced for teacher review rather than silently censored.

---

## Privacy advantages and legal compliance of client-side processing

Client-side processing offers significant privacy advantages for classroom deployment. Under **FERPA**, student writing shared with third-party APIs becomes a data disclosure requiring careful compliance. Under **COPPA** (children under 13), third-party platforms receiving student data trigger consent requirements. Under **CIPA**, schools receiving E-rate funding must implement content filtering.

**Client-side moderation satisfies CIPA while minimizing FERPA/COPPA exposure** — student text never leaves the browser, no third-party API receives student writing, processing is ephemeral with no external data retention, and there's no centralized database of student communications to breach. When API calls are genuinely needed (ambiguous content requiring ML classification), send only the text content without student identifiers, use the `doNotStore: true` flag (available in Perspective API), and prefer APIs with explicit no-logging policies (ModerateHatespeech).

If filter match logs are stored, they become education records under FERPA. Best practice is recording **aggregate statistics** (flags by category per day) rather than individual student records. If individual flags must be stored for safety monitoring (self-harm detection), apply strict access controls and retention limits.

---

## Conclusion

Building effective classroom content moderation in client-side JavaScript is genuinely feasible for profanity and explicit harmful content, practically achievable with caveats for bullying and threats, and fundamentally limited for subtle harm and political content. The most important technical investment is the **normalization pipeline** — without it, every detection layer downstream fails against trivial evasion. The most important architectural decision is **layered detection with weighted scoring** — no single technique covers all cases, but convergent signals from multiple methods provide reliable confidence estimates.

Three insights emerge that may not be obvious. First, the **Perspective API sunset** (December 2026) makes client-side capabilities and the OpenAI Moderation API strategically important — systems designed around Perspective need migration planning now. Second, the biggest gap in the ecosystem is not technology but **education-specific tooling** — no open-source library provides age-appropriate word lists, teacher-controlled sensitivity, or COPPA/FERPA-aware logging out of the box, representing a genuine opportunity for a physics teacher with strong technical skills. Third, the correct mental model for content moderation is not a filter but a **triage system** — automated detection prioritizes content for human review rather than serving as sole arbiter, and for classroom safety (especially self-harm detection), this distinction is not just technically important but ethically essential.