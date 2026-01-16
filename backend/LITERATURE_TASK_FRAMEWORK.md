# LITERATURE TASK GENERATION FRAMEWORK

## 📋 OVERVIEW

This framework implements a comprehensive, research-based approach to literature task generation based on pedagogical best practices and authentic literary analysis skills.

**Status**: ✅ **IMPLEMENTED** in modular prompt system
**Location**: `/backend/src/genai/prompts/modules/literature/`
**Template Size**: Enhanced significantly with 12 scenario archetypes
**Last Updated**: 2026-01-15

---

## 🎯 CORE CONCEPT

**Students are PROFESSIONALS USING LITERATURE, not students studying literature.**

Every literature task places students in authentic roles where literary analysis is essential for critical decision-making:
- Editors selecting works for publication
- Translators preserving literary effects across languages
- Therapists choosing texts for mental health treatment
- Detectives decoding literary references in investigations
- Curators authenticating manuscripts and rare books
- Directors adapting texts for performance
- Censorship analysts identifying political subtext

---

## 📚 4 CORE LITERARY KNOWLEDGE DOMAINS

### 1. 📖 LEXICAL KNOWLEDGE (Who, What, When, Where)
- **Authors & Biography**: Life circumstances influencing works, historical period, cultural background
- **Literary Movements**: Romanticism, Realism, Modernism, Postmodernism - defining characteristics
- **Works & Genres**: Novels, poetry, drama, essays - canonical and contemporary texts
- **Characters & Plots**: Major works' storylines, character relationships, narrative arcs
- **Historical & Cultural Context**: When/where works were written, social conditions, reception history
- **Literary Terminology**: Metaphor, symbolism, irony, narrative voice, meter, structure

### 2. 🔍 ANALYTICAL KNOWLEDGE (How to Interpret)
- **Character Analysis**: Personality, motivations, development, relationships
- **Symbolism & Imagery**: Recurring images, symbolic meanings, imagery patterns
- **Theme Analysis**: Central ideas, thematic development, human relevance
- **Narrative Structure**: Plot organization, perspective, pacing, structural effects
- **Literary Techniques**: Devices, sound patterns, rhetorical strategies
- **Comparative Analysis**: Similarities/differences, intertextuality, cultural variations
- **Contextual Analysis**: Historical shaping, social norms, contemporary interpretation

### 3. ✍️ CREATIVE & WRITING KNOWLEDGE
- **Complete fragmentary texts**: Finish incomplete poems, stories, scenes
- **Imitate styles**: Write in manner of specific authors or periods
- **Adapt across forms**: Transform poetry to prose, drama to narrative
- **Translate/Localize**: Preserve meaning and effects across languages
- **Create derivative works**: Sequels, prequels, alternative perspectives
- **Write critical responses**: Essays, reviews, scholarly arguments

### 4. 🌍 INTERDISCIPLINARY & CULTURAL IMPACT
- **Literature + History**: Texts as historical evidence, context shaping production
- **Literature + Law**: Censorship cases, copyright, legal text interpretation
- **Literature + Psychology**: Therapeutic uses, character psychology, bibliotherapy
- **Literature + Art**: Ekphrastic poetry, illustrated works, visual-textual dialogue
- **Literature + Media**: Adaptation, screenplay evaluation, documentary research

---

## 🎭 12 SCENARIO ARCHETYPES FOR LITERATURE TASKS

Each archetype creates authentic situations where literary knowledge is **ESSENTIAL**:

### 1. 📰 MAGAZINE EDITOR / LITERARY CURATOR

**Role**: Editor selecting works for publication
**Knowledge Required**: Quality assessment, thematic coherence, style analysis, audience fit
**Example**: "You are chief editor of *Nyugat* (Budapest, 1933). Evaluate 4 submitted poems for the September issue. Which 2 best represent avant-garde modernism while appealing to subscribers? Analyze style, theme, technique."

**What This Tests:**
- Comparative analysis of multiple texts
- Style and quality assessment
- Understanding literary movements
- Thematic coherence evaluation

---

### 2. ✍️ POETRY COMPLETION COMPETITION

**Role**: Poet completing fragmentary verse
**Knowledge Required**: Meter, rhyme schemes, style imitation, thematic coherence
**Example**: "Edinburgh Fringe, 2015. Complete final couplet of Romantic sonnet. Maintain iambic pentameter, ABAB CDCD EFEF GG rhyme, nature's transcendence theme."

**What This Tests:**
- Understanding poetic forms and meter
- Ability to analyze and imitate style
- Thematic interpretation
- Creative application of literary technique

---

### 3. 🎬 FILM PRODUCER / ADAPTATION SELECTOR

**Role**: Producer choosing novels for film adaptation
**Knowledge Required**: Narrative structure, cinematic potential, character complexity, theme identification
**Example**: "Netflix producer, LA, 2019. Evaluate 3 Latin American novels for adaptation: *Cien años de soledad*, *La casa de los espíritus*, *Ficciones*. Rank by feasibility. Analyze structure, visual potential, appeal."

**What This Tests:**
- Comparative narrative analysis
- Understanding structural complexity
- Theme and character assessment
- Cross-medium translation thinking

---

### 4. 🗺️ LITERARY TOUR GUIDE

**Role**: Tour guide creating literary location experiences
**Knowledge Required**: Text-to-place connections, historical context, symbolic geography
**Example**: "Design *García Lorca's Granada* walking tour, 2020. Connect 5 city locations to specific poems/plays. Provide textual excerpts, symbolic significance, historical context."

**What This Tests:**
- Close reading for setting details
- Historical and cultural context
- Symbolism and imagery analysis
- Connecting text to real-world locations

---

### 5. 🏆 NOBEL PRIZE COMMITTEE NOMINATION

**Role**: Committee member evaluating literary merit
**Knowledge Required**: Comprehensive work analysis, cultural impact, innovation, thematic significance
**Example**: "Swedish Academy Nobel Committee, Stockholm, 2010. Evaluate Vargas Llosa. Analyze 3 major works: *La ciudad y los perros*, *Conversación en la catedral*, *La fiesta del chivo*. Assess innovation, relevance, impact."

**What This Tests:**
- Comparative analysis across author's oeuvre
- Theme and technique identification
- Understanding literary innovation
- Cultural and historical context assessment

---

### 6. 🧠 THERAPY GROUP LEADER / BIBLIOTHERAPIST

**Role**: Therapist selecting literature for mental health treatment
**Knowledge Required**: Emotional tone, theme, character situations, reader impact
**Example**: "Poetry therapist, London clinic, 2018. Select 3 poems for grief counseling group (ages 40-65, lost spouses). Analyze emotional accessibility, loss/healing theme, non-triggering imagery, hopeful tone."

**What This Tests:**
- Theme analysis (grief, healing, hope)
- Emotional tone assessment
- Imagery and symbolism analysis
- Reader response prediction

---

### 7. 🔍 CENSORSHIP OFFICER / POLITICAL TEXT ANALYST

**Role**: Analyst identifying veiled political criticism
**Knowledge Required**: Allegory, symbolism, historical allusion, subtext
**Example**: "Soviet censorship analyst, Moscow, 1968. Evaluate novel using 18th-century historical setting. Identify potential allegorical anti-state content. Analyze character parallels, symbolic events, coded language."

**What This Tests:**
- Allegory and symbolism identification
- Subtext and coded meaning analysis
- Historical parallel recognition
- Close reading for double meanings

---

### 8. 📚 RARE BOOK COLLECTOR / AUTHENTICATION

**Role**: Collector identifying banned or historically significant works
**Knowledge Required**: Historical context, publication history, textual variants, censorship history
**Example**: "Rare book specialist, Sotheby's, New York, 2017. Identify which 2 of 4 books were banned in Franco's Spain (1939-1975). Analyze: political dissent, regional nationalism, religious heterodoxy, moral transgression."

**What This Tests:**
- Historical and political context
- Theme and content analysis
- Understanding censorship criteria
- Textual evidence identification

---

### 9. 🕵️ LITERARY HISTORIAN / AUTHENTICATION

**Role**: Historian verifying authorship and dating texts
**Knowledge Required**: Style analysis, historical language patterns, biographical context, textual comparison
**Example**: "Literary historian, University of Salamanca, 2015. Authenticate alleged 16th-century letter from Santa Teresa de Ávila. Analyze: language patterns, mystical imagery, biographical consistency, comparison to verified writings."

**What This Tests:**
- Style and voice analysis
- Comparative textual analysis
- Historical language knowledge
- Pattern recognition across texts

---

### 10. 📅 CHRONOLOGICAL STYLE ANALYST

**Role**: Scholar dating texts by style evolution
**Knowledge Required**: Literary period characteristics, author's stylistic development, historical language markers
**Example**: "Neruda scholar, Chile, 2012. Arrange 4 undated poems chronologically by analyzing style evolution: *Veinte poemas* (early romantic), *Residencia en la tierra* (surrealist), *Canto general* (political epic), *Odas elementales* (accessible simplicity)."

**What This Tests:**
- Understanding stylistic periods
- Comparative style analysis
- Recognizing literary movement characteristics
- Tracing author's development

---

### 11. 🔎 DETECTIVE / LITERARY CODE ANALYST

**Role**: Investigator decoding literary references in evidence
**Knowledge Required**: Literary allusion identification, symbolic meaning, authorial intent
**Example**: "Detective, Paris, 2016. Suspect's note reads: 'Meet where Baudelaire's albatross fell, when l'heure bleue fades.' Analyze: *L'Albatros* significance, Baudelaire's Paris locations, 'heure bleue' symbolic meaning. Decode meeting time/place."

**What This Tests:**
- Literary allusion identification
- Symbolic interpretation
- Contextual knowledge (biography, locations)
- Inferential reasoning from textual clues

---

### 12. 🖼️ ART AUCTION APPRAISER / EKPHRASIS

**Role**: Appraiser connecting artworks to literary inspiration
**Knowledge Required**: Ekphrastic tradition, visual-to-textual analysis, historical context, symbolism
**Example**: "Christie's specialist, London, 2018. Painting titled 'Ophelia' (1852, Millais). Analyze how it visually interprets *Hamlet* Act IV, Scene 7. Compare: textual imagery, botanical symbolism, Pre-Raphaelite interpretation. Authenticate literary fidelity."

**What This Tests:**
- Close reading of descriptive passages
- Visual-to-textual comparison
- Symbolism analysis (flowers, water, death)
- Understanding literary-artistic dialogue

---

## 📌 THE LITERATURE TASK FORMULA

```
AUTHENTIC PROFESSIONAL ROLE
    ↓
CRITICAL LITERARY DECISION NEEDED
    ↓
ONLY CLOSE TEXTUAL ANALYSIS SOLVES IT
    ↓
SUBSTANTIAL TEXT PROVIDED (20-150+ words)
    ↓
MULTIPLE OPTIONS TO EVALUATE
    ↓
INTERPRETATION REQUIRED (not just recall)
    ↓
CONSEQUENCES MATTER
```

**Every literature task = "You are [professional role]. You must [critical decision]. Here is [substantial text]. Based on [analytical skill], what do you conclude?"**

---

## ✅ TASK DESIGN PRINCIPLES

### EVERY LITERATURE TASK MUST:

1. **Place student in AUTHENTIC ROLE** requiring literary analysis
   - NOT "student studying literature"
   - YES: Editor, translator, curator, director, therapist, detective, critic

2. **Create GENUINE NEED** for textual analysis
   - Critical decision with consequences
   - Problem that ONLY close reading can solve
   - Real-world application (publishing, performance, adaptation, authentication)

3. **Provide SUBSTANTIAL PRIMARY TEXT** (20-150+ words minimum)
   - Complete poems or complete stanzas
   - Complete scenes or complete paragraphs
   - Sufficient text for meaningful analysis
   - Original formatting preserved (line breaks, punctuation)

4. **Demand INTERPRETATION**, not just recall
   - Analyze HOW text creates meaning
   - Compare multiple interpretive possibilities
   - Support claims with textual evidence
   - No single "right answer" (where appropriate)

5. **Match ANALYSIS TYPE to CURRICULUM TOPIC**
   - Character topic → Character analysis task
   - Symbolism topic → Symbolism analysis task
   - Theme topic → Theme analysis task
   - Technique topic → Technique analysis task

6. **Show CONSEQUENCES** of literary analysis
   - What happens if you misinterpret the character?
   - What if you miss the allegorical meaning?
   - What if you choose the wrong text for adaptation?

---

## 🚫 AVOID THESE FAILURES

❌ **"Analyze this poem" (no context)**
✅ **"You are poetry therapist selecting poems for grief counseling. Analyze tone, imagery, theme of these 3 poems. Which 2 are appropriate? Why?"**

❌ **Vague "What does the author mean?"**
✅ **"You are Soviet censor, 1968. Does this historical novel contain allegorical criticism of current regime? Analyze character parallels, symbolic events."**

❌ **No text provided, just asking about a work**
✅ **"Here are 20-150 words from Act 3. Analyze how Shakespeare uses imagery of disease/corruption to develop theme of moral decay."**

❌ **"How do you feel about this character?"**
✅ **"You are casting director. Based on these 3 dialogue excerpts, what personality traits must the actor convey? Provide textual evidence."**

---

## 📖 TEXT PROVISION STANDARDS

### Poetry Analysis:
- **Provide**: Complete poem OR complete stanzas being analyzed
- **Format**: Preserve line breaks, stanza divisions, original punctuation
- **Minimum**: 8-20 lines for meaningful analysis

### Drama Analysis:
- **Provide**: Complete dialogue exchanges, with speaker labels
- **Format**: Preserve stage directions if relevant to analysis
- **Minimum**: 20-150 words of dialogue

### Prose Analysis:
- **Provide**: Complete paragraphs or scenes, not fragments
- **Format**: Preserve paragraph breaks
- **Minimum**: 20-150 words for narrative analysis

### Comparative Analysis:
- **Provide**: Parallel excerpts from each text
- **Format**: Clearly label which text each excerpt is from
- **Minimum**: 20-150 words from EACH text

---

## 🌍 DIVERSITY REQUIREMENTS

### Geographic Coverage:
- ✅ Spanish Literature: Golden Age, Generation of '98, Generation of '27, contemporary
- ✅ Latin American Literature: Boom, post-Boom, contemporary voices, Indigenous perspectives
- ✅ United States Latino/a Literature: Chicano/a, Caribbean diaspora, border narratives
- ✅ Global Spanish: Philippines, Equatorial Guinea, Sephardic traditions
- ✅ Comparative: Spanish literature in dialogue with other traditions

### Temporal Coverage:
- Medieval (Cantar de Mio Cid, *Celestina*)
- Golden Age (Cervantes, Lope, Calderón, Quevedo, Góngora)
- 19th Century (Romanticism, Realism, Naturalism)
- Modernism & Generation of '98 (Darío, Unamuno, Machado)
- Avant-Garde & Generation of '27 (Lorca, Alberti, Cernuda)
- Contemporary (1950-present: Vargas Llosa, García Márquez, Allende, Bolaño)

### Genre Diversity:
- Poetry (lyric, epic, dramatic, experimental)
- Drama (comedy, tragedy, sainete, absurdist)
- Prose (novel, novella, short story, essay, chronicle)
- Hybrid/Experimental (prose poetry, metafiction, testimonio)

### Role Diversity:
- Publishing & Editorial: Agent, editor, translator, anthologist, magazine curator
- Performance & Adaptation: Theater director, screenwriter, podcast producer, opera librettist
- Scholarship & Criticism: Literary historian, biographer, attribution expert, periodization specialist
- Cultural Institutions: Museum curator, archive manager, library acquisition specialist, tour guide
- Therapeutic & Social: Bibliotherapist, grief counselor, prison literacy director
- Legal & Political: Censorship analyst, copyright expert, banned books specialist
- Investigation & Authentication: Detective, manuscript authenticator, forgery examiner, auction appraiser

---

## 🎓 PEDAGOGICAL BENEFITS

### Traditional Literature Teaching (What We Avoid):
❌ Memorize author names and dates
❌ "Study" plot summaries passively
❌ Generic "What is the theme?" questions
❌ No clear real-world application
❌ Recall-based quizzes

### EduForger Literature Approach (What We Do):
✅ **Analyze** text closely for specific professional purposes
✅ **Compare** multiple texts or interpretations
✅ **Evaluate** literary quality, thematic coherence, stylistic effectiveness
✅ **Apply** literary knowledge to real decisions (publishing, performance, therapy)
✅ **Create** derivative works demonstrating deep understanding
✅ **Argue** for interpretations using textual evidence
✅ **Experience** literature as professionals use it

---

## 🎯 EXAMPLE: COMPLETE TASK USING FRAMEWORK

### Scenario Archetype: #7 Censorship Officer / Political Text Analyst

**YOU ARE**: Soviet censorship analyst, Moscow, 1968

**CONTEXT**: Post-Prague Spring. Author submits novel set in 18th-century Russia during Catherine the Great's reign. Claims it's "historical fiction" about aristocratic corruption. Your task: determine if it contains allegorical criticism of current Soviet leadership.

**HISTORICAL PARALLELS TO CONSIDER**:
1. **Previous allegorical novels**: *Animal Farm* (Orwell, banned 1945), *Doctor Zhivago* (Pasterov, banned 1957), *Master and Margarita* (Bulgakov, unpublished until 1966-67)
2. **Recent political context**: Prague Spring suppression (August 1968), Brezhnev Doctrine announced, intellectual dissent rising
3. **Common allegorical techniques**: Historical displacement, character name symbolism, symbolic events mirroring current politics, coded language

**PRIMARY TEXT PROVIDED**:
[Excerpt from novel, 20-150 words describing "Tsar's inner circle" with corrupt advisors, a reformist prince silenced, and peasants whispering about "the time when truth will speak." Includes dialogue where advisor says: "We must maintain stability above all. Foreign agitators threaten our way of life."]

**YOUR TASK**:
Analyze this excerpt for potential anti-state allegorical content:

1. **Character Analysis**: Do historical figures parallel current Soviet leadership? Is "corrupt advisor" = Politburo members? Is "silenced reformist prince" = Czech reformers?

2. **Symbolic Events**: Does peasant discontent = contemporary worker dissent? Does "foreign agitators" language mirror Brezhnev Doctrine rhetoric about Czech invasion?

3. **Coded Language**: Are there double meanings? "Stability" = repression? "Truth will speak" = future liberalization?

4. **Publication Timing**: Why submit this NOW, post-Prague Spring? Is timing significant?

5. **DECISION**: Recommend A) Ban entirely, B) Require revisions (specify), C) Approve with warning, D) Approve without restrictions. Justify using textual evidence.

**SUCCESS CRITERIA**: Your analysis must:
- Identify at least 3 specific textual examples of potential allegory
- Compare to known allegorical techniques in banned works
- Consider historical/political context of publication moment
- Make evidence-based recommendation
- Acknowledge alternative (innocent) interpretations

---

## 🔥 THE ULTIMATE TEST

**Ask yourself**: Would a professional editor/translator/director/curator **ACTUALLY** need to analyze this text in this way to make this decision?

✅ YES: Authentic literary task
❌ NO: Fake "textbook question" disguised as scenario

---

## 📊 IMPLEMENTATION STATUS

✅ **COMPLETED**:
- 12 scenario archetypes defined and implemented
- 4 core knowledge domains integrated
- Literary analysis framework established
- Diversity requirements specified (geographic, temporal, genre, role)
- Primary text integration guidelines
- Enhanced prompt modules with specific examples
- Tested and validated in modular template system

🎯 **IN PRODUCTION**:
- All literature tasks generated through EduForger now use this framework
- AI receives comprehensive guidance for creating authentic literary tasks
- Students experience literature as professionals use it

---

## 📚 RELATED DOCUMENTATION

- `/backend/MODULAR_TEMPLATE_SYSTEM.md` - Overall template architecture
- `/backend/src/genai/prompts/modules/literature/analysis_types.md` - Full archetype details
- `/backend/src/genai/prompts/modules/literature/scenario_patterns.md` - Scenario examples with dates/locations
- `/backend/src/genai/prompts/modules/literature/evidence_requirements.md` - Text provision specifications

---

## ✨ CONCLUSION

This framework transforms literature education from passive reading comprehension to active professional literary analysis. Students don't "study" literature—they **USE** literature the way editors, translators, directors, curators, therapists, and scholars actually use it: to select texts for publication, authenticate manuscripts, adapt for performance, identify political subtext, and make critical cultural decisions.

**Every literature task = Real professional work using real literary texts in real decisions.**

---

## 📌 REMEMBER

**Literary analysis REQUIRES primary source text.**

**If you haven't provided substantial text (20-150+ words), you haven't created a literature task - you've created a quiz about literature.**

**There's a difference:**
- **Quiz**: "Who is Don Quixote?" (tests memory)
- **Literary Analysis**: "Based on these three dialogue excerpts, how does Cervantes characterize Don Quixote as both mad and wise?" (tests interpretation)

**We create ANALYSIS tasks, not quizzes.**

---

*Framework Version: 2.0*
*Last Updated: 2026-01-15*
*Status: ✅ Production Ready*
