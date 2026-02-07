\newpage
**Page 1 ? Title Page**

**ATRIQUET: A Vision?Language Fashion Recommendation System with Outfit Appropriateness Critique and Real?Item Image Retrieval**

Author: Prepared for the ATRIQUET project  
Affiliation: Internal project research memo  
Date: February 6, 2026  
Location: United States

\newpage
**Page 2 ? Abstract**

ATRIQUET is an AI fashion recommendation system that analyzes full?body images to critique outfit appropriateness for a specified occasion and style, then produces actionable styling recommendations. The system combines a FastAPI backend that orchestrates vision?language inference with a Next.js frontend that collects user input and displays results. This paper presents a structured analysis of the current implementation, focusing on system architecture, model orchestration, recommendation parsing, and optional real?item image enrichment. We situate ATRIQUET within the broader literature on fashion datasets, outfit compatibility modeling, and virtual try?on systems, highlighting design differences between ATRIQUET?s LLM?driven critique?and?recommend pipeline and more traditional compatibility or synthesis approaches. We also provide a performance snapshot from project benchmarks, discuss reliability and privacy risks (including the presence of plaintext keys in documentation), and propose a prioritized future roadmap. The paper emphasizes a pragmatic engineering assessment while maintaining a professional research style.

\newpage
**Page 3 ? Keywords**

Fashion recommendation, vision?language models, outfit appropriateness, FastAPI, Next.js, multimodal AI, stylistic critique, clothing image retrieval.

\newpage
**Page 4 ? Table of Contents**

1. Introduction  
2. Project Background and Motivation  
3. Problem Statement and Objectives  
4. System Scope and Assumptions  
5. Related Work: Fashion Datasets  
6. Related Work: Outfit Compatibility Modeling  
7. Related Work: Virtual Try?On Systems  
8. System Overview  
9. Data Flow and API Surface  
10. Backend Design: API and Orchestration  
11. Backend Design: Model Services  
12. Backend Design: Recommendation Parsing  
13. Backend Design: Clothing Image Retrieval  
14. Backend Design: Caching and Performance  
15. Frontend Design: UX and Components  
16. Evaluation Methodology  
17. Performance Results  
18. Reliability and Error Handling  
19. Security and Privacy Analysis  
20. Ethical and Bias Considerations  
21. Limitations and Technical Debt  
22. Comparative Analysis and Uniqueness  
23. Future Work  
24. Conclusion  
25. References

\newpage
**Page 5 ? List of Tables and Figures**

Table 1. System components and responsibilities  
Table 2. API endpoints and inputs/outputs  
Table 3. Benchmark timing summary  
Figure 1. High?level architecture (described)  
Figure 2. End?to?end data flow (described)

\newpage
**Page 6 ? 1. Introduction**

The ATRIQUET project aims to deliver an AI?powered personal styling experience based on a single full?body image and a small set of user?selected parameters. Unlike classic fashion recommendation pipelines that rely on historical purchase data or collaborative filtering, ATRIQUET directly analyzes a user?s current outfit and returns a critique along with alternative recommendations tailored to the occasion. The system is intended to be fast, simple to deploy, and user?friendly, with a polished front?end experience and a minimal backend footprint.

This paper documents the current implementation at an engineering and research level. It analyzes architectural choices, model integrations, and potential gaps between documentation and code. It also compares ATRIQUET to established academic work in fashion vision and recommendation to clarify what is novel and what is inherited from prior efforts.

\newpage
**Page 7 ? 2. Project Background and Motivation**

The project is motivated by a practical gap: users often want immediate, personalized feedback about outfit suitability for specific contexts without having to learn formal fashion heuristics. Traditional stylists and fashion apps either require prolonged interaction, product catalogs, or static style guides. ATRIQUET targets a lower?friction workflow: upload a photo, choose an occasion and style, and receive a focused critique plus alternatives.

From a technical standpoint, the system leverages the recent capabilities of vision?language models to reason about appearance and context. The motivation is not merely to classify garments but to translate an image into actionable guidance grounded in occasion?appropriate styling.

\newpage
**Page 8 ? 3. Problem Statement and Objectives**

**Problem Statement:**  
Given a user?provided full?body image and a target occasion/style, produce a concise critique of outfit appropriateness and a small set of alternative outfit recommendations that are specific, comprehensible, and easy to act on.

**Objectives:**  
1. Accept and validate user images reliably under typical consumer constraints.  
2. Use a vision?language model to extract qualitative observations and make a suitability judgment.  
3. Generate 3 focused outfit alternatives when the current outfit is inappropriate.  
4. Provide structured fields for each recommendation to support UI presentation.  
5. Enrich recommendations with real clothing images where possible.  
6. Deliver results within a human?acceptable latency envelope.

\newpage
**Page 9 ? 4. System Scope and Assumptions**

ATRIQUET is designed as a lightweight, deployment?friendly service. The backend does not maintain a strict dependence on persistent databases in its core flow, and image processing is performed transiently in memory. The system assumes that an image is a reasonably clear, full?body photograph and that a user can choose an occasion and style from a bounded list.

The current implementation prioritizes a single?image analysis workflow rather than a long?term personalization loop. This scope is a deliberate simplification intended to accelerate usage and minimize privacy risk.

\newpage
**Page 10 ? 5. Related Work: Fashion Datasets**

Large?scale datasets provide the foundation for fashion recognition and retrieval research. DeepFashion introduced a richly annotated dataset exceeding 800K images with categories, attributes, landmarks, and cross?pose correspondences, enabling robust clothing recognition and retrieval models. ([cv-foundation.org](https://www.cv-foundation.org/openaccess/content_cvpr_2016/html/Liu_DeepFashion_Powering_Robust_CVPR_2016_paper.html?utm_source=openai)) The existence of such datasets informs system choices in downstream tasks and highlights a gap between data?intensive learned methods and ATRIQUET?s more reasoning?centric pipeline.

In ATRIQUET?s case, the pipeline does not explicitly train on DeepFashion, but the dataset remains relevant when evaluating potential future improvements such as compatibility learning or robust attribute extraction.

\newpage
**Page 11 ? 6. Related Work: Outfit Compatibility Modeling**

Outfit recommendation research often distinguishes between similarity (items of the same type that are interchangeable) and compatibility (items of different types that work together). The type?aware embedding approach proposed by Vasileva et al. learns item representations that respect category types while also optimizing pairwise compatibility, improving performance on compatibility prediction and fill?in?the?blank tasks. ([openaccess.thecvf.com](https://openaccess.thecvf.com/content_ECCV_2018/html/Mariya_Vasileva_Learning_Type-Aware_Embeddings_ECCV_2018_paper.html?utm_source=openai))

ATRIQUET does not learn a compatibility embedding; instead, it uses a vision?language model to reason about style appropriateness and construct recommendations directly. This reflects a design choice favoring explainable text output over learned embedding retrieval.

\newpage
**Page 12 ? 7. Related Work: Virtual Try?On Systems**

Virtual try?on research aims to synthesize images of a person wearing alternative garments. VITON introduced a 2D image?based virtual try?on pipeline that avoids 3D modeling, using a coarse?to?fine synthesis approach conditioned on clothing?agnostic representations. ([arxiv.org](https://arxiv.org/abs/1711.08447)) CP?VTON extended this line of work by explicitly learning geometric transformations and composition masks to preserve garment characteristics such as texture or logo details. ([arxiv.org](https://arxiv.org/abs/1807.07688))

ATRIQUET does not synthesize a try?on image of the user wearing each recommended garment. Instead, it provides textual recommendations and optionally retrieves real clothing item images from web sources. This is a fundamentally different strategy that emphasizes decision support rather than photorealistic visualization.

\newpage
**Page 13 ? 8. System Overview**

ATRIQUET consists of a FastAPI backend and a Next.js frontend.

**Backend Responsibilities:**  
- Receive and validate uploaded images.  
- Convert images to base64.  
- Invoke a vision?language model to assess outfit appropriateness.  
- Parse model output into structured recommendations.  
- Optionally enrich recommendations with real clothing images.

**Frontend Responsibilities:**  
- Collect image, occasion, and style input.  
- Submit form data to the backend.  
- Present critique, suggestions, and recommended outfits in a stylized UI.

Table 1 summarizes the components.

Table 1. System components and responsibilities  
Component: FastAPI API  
Responsibility: Input validation, orchestration, response aggregation  
Component: Recommendation engine  
Responsibility: Model prompting, output parsing, response shaping  
Component: Clothing image service  
Responsibility: Fetch real item images from external APIs  
Component: Next.js frontend  
Responsibility: User interaction, results display, UI animations

\newpage
**Page 14 ? 9. Data Flow and API Surface**

The primary API endpoint is `POST /api/analyze`, which accepts a multipart form upload. The key input fields are image, occasion, style, and include_brands. The backend returns a JSON response containing an appropriateness verdict, critique, improvement suggestions, and up to three recommended outfits.

Table 2. API endpoints and inputs/outputs  
Endpoint: `POST /api/analyze`  
Inputs: image, occasion, style, include_brands  
Outputs: is_appropriate, critique, recommendations, styling tips, processing_time  
Endpoint: `POST /api/quick-analyze`  
Inputs: image  
Outputs: brief description of outfit  
Endpoint: `GET /api/occasions`  
Outputs: list of occasion strings  
Endpoint: `GET /api/styles`  
Outputs: list of style strings

The data flow is linear: image upload ? base64 conversion ? model call ? response parsing ? optional clothing image retrieval ? JSON response.

\newpage
**Page 15 ? 10. Backend Design: API and Orchestration**

The `main.py` FastAPI application initializes the system?s core services: a Groq service for image analysis, an OpenRouter service for quick analysis, a recommendation engine to orchestrate model calls and parsing, and a clothing image retrieval service. The backend is configured with permissive CORS to allow the Next.js frontend to call it directly.

The analysis endpoint uses a single request pipeline with coarse validation: it verifies that image size is below 10MB and then processes the image. Errors are handled by raising HTTP exceptions and logging tracebacks.

\newpage
**Page 16 ? 11. Backend Design: Model Services**

The system uses two distinct model clients.

1. GroqService:  
A Groq client is configured to run a Llama?4?Scout vision model. It accepts a prompt and an image data URL, returning raw text.

2. OpenRouterService:  
An OpenRouter client is configured for quick?analysis tasks, currently using a Llama?3.2 vision model.

These services are wrapped by the recommendation engine, which constructs prompts and parses the raw text output into structured fields.

\newpage
**Page 17 ? 12. Backend Design: Recommendation Parsing**

The recommendation engine uses a two?step process. First, it extracts basic user attributes for avatar or presentation logic. Second, it prompts the model to judge appropriateness and, if inappropriate, to produce three alternative outfits with labeled fields.

The parsing strategy is string?based. It identifies markers such as ?APPROPRIATE:? and ?OUTFIT 1:? and slices the text to populate structured fields such as top, bottom, shoes, colors, and rationale. This approach is practical but sensitive to model formatting deviations.

\newpage
**Page 18 ? 13. Backend Design: Clothing Image Retrieval**

To provide visual grounding for recommendations, ATRIQUET optionally calls a clothing image retrieval service. This service can query Unsplash and Pexels via API keys or fall back to DuckDuckGo?s instant answer API. If no suitable image is found, it uses placeholder image services.

The service runs queries asynchronously for top, bottom, and shoes. The results are inserted into each recommendation as `top_image_url`, `bottom_image_url`, and `shoes_image_url`. This design allows the frontend to display real item images without requiring a dedicated inventory.

\newpage
**Page 19 ? 14. Backend Design: Caching and Performance**

A cache manager is initialized but not heavily exploited in the current pipeline. The system?s latency is dominated by model inference, which can vary significantly based on model warm?start status.

The presence of benchmark logs indicates performance testing with cold and warm runs. The system is optimized for responsiveness but is still bound by the inference time of the vision?language model.

\newpage
**Page 20 ? 15. Frontend Design: UX and Components**

The frontend implements a single?page experience with a hero upload section and a results section. It uses motion?based transitions for a premium feel. The key UX flow is:

1. User selects occasion and style from a floating nav.  
2. User uploads a photo.  
3. User clicks ?Get My Recommendations.?  
4. Results view displays critique, tips, and recommendations.

The UI currently expects an avatar image (via `avatar_image_url`), but the backend does not reliably generate avatars, creating a mismatch that should be resolved.

\newpage
**Page 21 ? 16. Evaluation Methodology**

Evaluation in this paper is limited to system?level performance metrics available from project artifacts. We focus on:

- Response time under cold and warm conditions.  
- Output completeness under typical use.  
- Observed stability of the parsing pipeline.

A broader evaluation would include human rating of recommendation quality, consistency across different body types, and A/B testing of UI elements.

\newpage
**Page 22 ? 17. Performance Results**

The benchmark log indicates a cold start time of 16.14 seconds and average warm request time of 7.66 seconds, with a fastest warm request of 5.66 seconds. This yields a roughly 2.1? improvement after warm?up.

Table 3. Benchmark timing summary  
Cold start: 16.14s  
Warm average: 7.66s  
Fastest warm: 5.66s  
Observed warmup improvement: ~2.1?

These results are consistent with a system dominated by model load and inference time.

\newpage
**Page 23 ? 18. Reliability and Error Handling**

The pipeline includes basic exception handling at the API layer and logs stack traces for debugging. The recommendation parser is brittle because it relies on text patterns rather than structured JSON; model output variations can cause partial or empty recommendations. This creates a reliability risk that should be addressed by tightening the prompt format or using JSON?only responses with schema validation.

The frontend displays helpful error messages but does not currently provide a retry or fallback mechanism.

\newpage
**Page 24 ? 19. Security and Privacy Analysis**

The repository documentation includes plaintext API keys, which is a critical security issue. Keys should be removed from documentation, rotated, and managed through environment variables or secrets tooling. The pipeline itself processes images in memory, which reduces persistence risk, but it still sends user images to third?party model providers. A privacy policy and explicit user consent are required for production deployment.

The system?s permissive CORS settings are suitable for development but should be restricted for production.

\newpage
**Page 25 ? 20. Ethical and Bias Considerations**

Vision?language models can encode biases related to body types, gender presentation, and cultural norms. A fashion critique system may inadvertently reinforce narrow aesthetic standards or offer inappropriate recommendations for non?Western contexts. These risks are exacerbated when the system presents high?confidence suggestions without uncertainty or user controls.

Mitigations include explicit disclaimers, diverse training data for any future fine?tuning, and feedback mechanisms to allow users to refine or reject recommendations.

\newpage
**Page 26 ? 21. Limitations and Technical Debt**

Key limitations include:

- Documentation drift: README describes Groq + Gemini + DALL?E, while code uses Groq Llama?4 and DiceBear?style avatars.  
- Parsing fragility: the output parser depends on textual markers.  
- UI mismatch: frontend expects avatar output that is not consistently generated.  
- Lack of tests for model output schema compliance.  
- External dependencies: clothing images rely on third?party APIs with rate limits.

These issues can be addressed with stricter schema contracts, API interface tests, and tighter documentation.

\newpage
**Page 27 ? 22. Comparative Analysis and Uniqueness**

Compared with compatibility?embedding systems, ATRIQUET does not compute a learned compatibility score from item images or embeddings. Instead, it uses a vision?language model to critique the current outfit and construct recommendations directly in text. This is a fundamentally different paradigm from type?aware embeddings, which learn compatibility in a metric space. ([openaccess.thecvf.com](https://openaccess.thecvf.com/content_ECCV_2018/html/Mariya_Vasileva_Learning_Type-Aware_Embeddings_ECCV_2018_paper.html?utm_source=openai))

Compared with virtual try?on systems like VITON and CP?VTON, ATRIQUET avoids garment synthesis entirely. It does not generate a photorealistic try?on image; it provides recommendation text and optional real item images from the web. This makes it simpler to deploy but less visually precise than true try?on systems. ([arxiv.org](https://arxiv.org/abs/1711.08447))

This positioning suggests ATRIQUET is best framed as a vision?language stylist and critique engine rather than a virtual try?on system.

\newpage
**Page 28 ? 23. Future Work**

1. Enforce JSON?only model responses and add schema validation.  
2. Resolve UI?backend mismatch by either removing avatar elements or implementing consistent avatar generation.  
3. Add compatibility?embedding or retrieval?based baselines for comparison.  
4. Incorporate user feedback loops for personalization.  
5. Implement model?side safety filters to avoid biased or inappropriate critiques.  
6. Improve cache utilization for repeated queries and faster response.

\newpage
**Page 29 ? 24. Conclusion**

ATRIQUET demonstrates a practical, LLM?driven approach to fashion recommendation that prioritizes stylistic critique and actionable guidance over full try?on synthesis. Its architecture is straightforward, making it attractive for rapid deployment, but it carries technical debt from documentation drift, parsing fragility, and UI?backend mismatches.

In the broader context of fashion research, ATRIQUET occupies a distinct niche between compatibility modeling and virtual try?on: it emphasizes interpretability and guidance while outsourcing visual realism to optional web image retrieval. With targeted improvements, it can become a robust, user?centric fashion assistant.

\newpage
**Page 30 ? 25. References**

DeepFashion: Powering Robust Clothes Recognition and Retrieval With Rich Annotations, CVPR 2016. ([cv-foundation.org](https://www.cv-foundation.org/openaccess/content_cvpr_2016/html/Liu_DeepFashion_Powering_Robust_CVPR_2016_paper.html?utm_source=openai))  

Learning Type?Aware Embeddings for Fashion Compatibility, ECCV 2018. ([openaccess.thecvf.com](https://openaccess.thecvf.com/content_ECCV_2018/html/Mariya_Vasileva_Learning_Type-Aware_Embeddings_ECCV_2018_paper.html?utm_source=openai))  

VITON: An Image?based Virtual Try?on Network, arXiv:1711.08447. ([arxiv.org](https://arxiv.org/abs/1711.08447))  

Toward Characteristic?Preserving Image?based Virtual Try?On Network (CP?VTON), arXiv:1807.07688. ([arxiv.org](https://arxiv.org/abs/1807.07688))
