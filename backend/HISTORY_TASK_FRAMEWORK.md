# HISTORY TASK GENERATION FRAMEWORK

## 📋 OVERVIEW

This framework implements a comprehensive, research-based approach to history task generation based on pedagogical best practices and authentic historical thinking skills.

**Status**: ✅ **IMPLEMENTED** in modular prompt system
**Location**: `/backend/src/genai/prompts/modules/history/`
**Template Size**: 85,824 characters (enhanced from 51,000)
**Last Updated**: 2026-01-15

---

## 🎯 CORE CONCEPT

**Students are PROFESSIONALS USING HISTORY, not students studying history.**

Every history task places students in authentic roles where historical knowledge is essential for critical decision-making:
- Diplomats analyzing treaty precedents
- Military commanders applying historical strategy
- Judges evaluating legal precedent
- Museum curators authenticating artifacts
- Policy advisors comparing historical approaches

---

## 📚 5 CORE HISTORICAL KNOWLEDGE DOMAINS

### 1. 📅 LEXICAL KNOWLEDGE (Who, What, When, Where)
- **Dates & Chronology**: Specific dates, time intervals, process phases
- **Events**: Battles, revolutions, campaigns, reforms, treaties
- **Actors**: Countries, empires, rulers, commanders, social movements
- **Locations**: Strategic cities, trade routes, battle sites, regions
- **Processes**: Wars, alliances, economic policies, trade systems

### 2. 🔗 PROCESS & CAUSATION (Why Things Happened)
- **Cause-Effect Relationships**: Triggers and consequences
- **Multiple Causation**: Economic, political, social, cultural factor interactions
- **Long-term vs. Immediate Causes**: Underlying conditions vs. triggering events
- **Intended vs. Unintended Consequences**: Plans vs. actual outcomes

### 3. 👑 HISTORICAL TRAJECTORIES (Rise, Peak, Decline, Fall)
- **Leader Career Paths**: Rise → Peak → Weakening → Fall
- **Empires & Nations**: Flourishing → Stagnation → Decline → Destruction
- **Political Systems**: Formation → Consolidation → Crisis → Transformation
- **Economic Cycles**: Growth → Peak → Recession → Recovery/Collapse

### 4. 🏺 ARCHAEOLOGICAL & MATERIAL EVIDENCE
- **Artifacts**: Tools, weapons, art, architecture, coins, inscriptions
- **Physical Evidence**: Supporting/challenging historical theories
- **Dating Methods**: Determining age and authenticity
- **Cultural Context**: What objects reveal about societies

### 5. 📖 PRIMARY SOURCE ANALYSIS
- **Document Types**: Letters, treaties, laws, speeches, diaries, records
- **Author Perspective**: Who wrote it? Why? What bias?
- **Historical Context**: What was happening when created?
- **Reliability Assessment**: How trustworthy is this source?

---

## 🎭 12 SCENARIO ARCHETYPES

Each archetype creates authentic situations where historical knowledge is **ESSENTIAL**:

### 1. 🤝 DIPLOMATIC NEGOTIATION & ALLIANCE BUILDING
**Role**: Diplomat/high-ranking official
**Knowledge Required**: Past treaties, alliances, betrayals, power dynamics
**Example**: "You are a French diplomat in 1778. Benjamin Franklin seeks alliance. What do historical precedents suggest?"

### 2. ⚔️ MILITARY STRATEGY & TACTICAL DECISIONS
**Role**: Military commander
**Knowledge Required**: Proven strategies, tactics, terrain analysis
**Example**: "You defend Vienna vs. Ottomans (1529). What worked in Constantinople (1453)? Rank: sally, attrition, negotiation, relief."

### 3. 👰 DYNASTIC MARRIAGE & ALLIANCE STRATEGY
**Role**: Ruler arranging political marriage
**Knowledge Required**: Power dynamics, past marriage outcomes, strategic value
**Example**: "King Ferdinand II, 1469. Daughter can marry: Castile (unites Spain), France (powerful), England (trade). Analyze."

### 4. 🎨 ARTIFACT DATING & AUTHENTICATION
**Role**: Expert determining origin/age/authenticity
**Knowledge Required**: Era characteristics, materials, techniques, forgery patterns
**Example**: "Caravaggio attributed painting, £5M. Frame wood dated 1750s. Features: chiaroscuro, oil on canvas. Authentic?"

### 5. 🛢️ RESOURCE ACQUISITION & STRATEGIC CONTROL
**Role**: Leader securing critical resources
**Knowledge Required**: Resource locations, historical control, past conflicts
**Example**: "You are Göring, 1941. Oil sources: Romania (allied), Caucasus (Soviet), Middle East (British). Rank."

### 6. 🏛️ INFRASTRUCTURE DEVELOPMENT DECISIONS
**Role**: Leader prioritizing public works
**Knowledge Required**: Comparable projects, outcomes, costs/benefits
**Example**: "Roman consul, 312 BCE. Fund ONE: Via Appia road, Aqua Appia aqueduct, walls, circus. Rank by strategic value."

### 7. 🚢 TRADE ROUTES & ECONOMIC CONTROL
**Role**: Advisor identifying strategic trade control points
**Knowledge Required**: Trade routes, chokepoints, historical control consequences
**Example**: "Advise Elizabeth I, 1580s. Which 3 points challenge Spanish trade dominance? Cape, Caribbean, Magellan, Newfoundland, Malacca."

### 8. 💰 TAXATION, TARIFFS & ECONOMIC POLICY
**Role**: Finance minister designing tax system
**Knowledge Required**: Tax systems, economic effects, revolt triggers, policy outcomes
**Example**: "You are Colbert, 1661. French debt crushing. Tax nobles? Promote trade? Sell offices? What worked historically?"

### 9. ⚖️ SOCIAL CLASS TENSIONS & CONFLICT RESOLUTION
**Role**: Advisor managing social tensions
**Knowledge Required**: Class structures, revolt triggers, repression vs. reform outcomes
**Example**: "Advise Tsar Nicholas II, 1905. Workers demand parliament. Repression vs. reform? What happened in France 1789, Britain 1832, Germany 1848?"

### 10. 🗳️ IDEOLOGIES, RELIGIONS & CULTURAL MOVEMENTS
**Role**: Leader responding to ideological spread
**Knowledge Required**: How ideologies spread, containment strategies, long-term impact
**Example**: "Pope Leo X, 1517. Luther's 95 Theses. Ignore? Excommunicate? Council? Force? What happened with Cathars, Wycliffe, Hus?"

### 11. ⚔️ POWER STRUGGLES, SUCCESSION CRISES & COURT INTRIGUE
**Role**: Advisor navigating succession crisis
**Knowledge Required**: Historical succession outcomes, strategies, institution roles
**Example**: "William Marshal, 1189. Henry II dying. Support Richard (strong), John (treasury), or Arthur (legal claim)? Avoid civil war."

### 12. 💀 JUSTICE, PUNISHMENT & SOCIAL CONTROL METHODS
**Role**: Justice official choosing punishment methods
**Knowledge Required**: Punishment systems, effectiveness, public perception, consequences
**Example**: "Revolutionary France, 1793. Royalists, hoarders, deserters. Guillotine? Hanging? Exile? What were consequences of Terror in Rome, medieval Europe, French monarchy?"

---

## 🎯 THE HISTORICAL INQUIRY FRAMEWORK

Every task should enable students to answer:

### **WHO / WHAT?**
- Which actors? (Countries, states, persons, institutions, social groups)
- What interests did they represent?
- What alliances existed?

### **WHEN?**
- Specific event date
- Interval of an ongoing process
- Phases of the process
- OR estimate: yearly, decade, or century precision

### **WHERE?**
- Important locations
- Affected areas
- Strategic geographic points
- Trade routes, borders, regions

### **WHY?**
- Causes (economic, political, social, cultural, ideological)
- Connections and their explanations
- Multiple perspectives on causation

### **HOW?**
- Methods, strategies, tactics employed
- Process by which change occurred
- Mechanisms of power, control, influence

### **WHAT WERE THE CONSEQUENCES?**
- Immediate vs. long-term effects
- Intended vs. unintended outcomes
- Winners and losers
- Historical legacy

---

## ✅ TASK DESIGN PRINCIPLES

### EVERY HISTORY TASK MUST:

1. **Place student in AUTHENTIC ROLE** requiring historical knowledge
   - NOT "student studying history"
   - YES: Diplomat, ruler, commander, judge, curator, journalist, researcher

2. **Create GENUINE NEED** for historical analysis
   - Critical decision with consequences
   - Problem that ONLY historical knowledge can solve
   - Real-world application (policy, law, strategy, authentication)

3. **Require SPECIFIC HISTORICAL KNOWLEDGE**, not vague generalities
   - Exact dates, events, figures, documents
   - Precise geographic locations
   - Concrete examples from actual history

4. **Demand COMPARISON & ANALYSIS**, not just recall
   - Compare multiple historical examples
   - Identify patterns across cases
   - Evaluate outcomes of different approaches
   - Apply lessons to new situations

5. **Provide PRIMARY SOURCES or detailed historical evidence**
   - Actual excerpts from treaties, letters, speeches, laws
   - Archaeological evidence descriptions
   - Statistical data from the period
   - Multiple perspectives on the same event

6. **Show CONSEQUENCES** of historical knowledge application
   - What happens if you choose wrong alliance?
   - What if you misdate the artifact?
   - What if you ignore historical precedent?

---

## 🚫 AVOID THESE FAILURES

❌ **Generic "World War II question"**
✅ **"Analyzing the Yalta Conference transcripts, February 1945"**

❌ **Vague "Renaissance art"**
✅ **"Authenticating a specific Caravaggio painting using period techniques"**

❌ **Abstract "ancient Rome"**
✅ **"Consul's infrastructure decision, 312 BCE, comparing Via Appia vs. Aqua Appia"**

❌ **"Study this battle"**
✅ **"You are at Waterloo. Wellington asks: What did Napoleon's tactics at Austerlitz suggest he'll do next?"**

---

## 📌 THE HISTORY TASK FORMULA

```
AUTHENTIC ROLE
    ↓
CRITICAL DECISION NEEDED
    ↓
ONLY HISTORICAL KNOWLEDGE SOLVES IT
    ↓
SPECIFIC EVIDENCE PROVIDED
    ↓
MULTIPLE OPTIONS TO EVALUATE
    ↓
ANALYSIS REQUIRED (not just recall)
    ↓
CONSEQUENCES MATTER
```

**Every history task = "You are [historical role]. You must [critical decision]. Here is [specific evidence]. Based on [historical parallels], what do you do?"**

---

## 🌍 DIVERSITY REQUIREMENTS

### Geographic Coverage:
- ✅ Ancient World: Mesopotamia, Greece, Rome, China, India, Americas, Africa
- ✅ Medieval: Islamic Golden Age, Medieval Africa, Mongol Empire, Byzantine, East Asia
- ✅ Early Modern: Ottoman/Safavid/Mughal, Atlantic World, Ming/Qing China, Tokugawa Japan
- ✅ Modern: Industrialization (global), Imperialism & resistance, World Wars (multiple perspectives)
- ✅ Contemporary: Decolonization, Cold War, Globalization, Post-colonial states

### Temporal Coverage:
- Ancient (Before 500 CE)
- Medieval (500-1500 CE)
- Early Modern (1500-1800)
- Modern (1800-1945)
- Contemporary (1945-Present)

### Role Diversity:
- Political/Military: Emperor, king, consul, general, diplomat, revolutionary leader
- Economic: Merchant, banker, tax collector, guild master, economic advisor
- Religious: Pope, bishop, imam, rabbi, priest (institutional decisions)
- Legal: Judge, lawyer, legislator, constitutional framer
- Intellectual: Philosopher, scientist, historian, educator, journalist
- Cultural: Artist, architect, museum curator, archaeologist
- Administrative: Urban planner, infrastructure manager, public health official

---

## 📖 PRIMARY SOURCE INTEGRATION

Every scenario should reference actual historical documents:

**Treaties**: Westphalia (1648), Versailles (1919), UN Charter (1945)
**Letters**: Jefferson-Adams correspondence, Churchill-Roosevelt cables
**Laws**: Hammurabi's Code, Magna Carta, Code Napoléon
**Speeches**: Gettysburg Address, "Iron Curtain" speech, "I Have a Dream"
**Government Records**: Domesday Book, census data, diplomatic cables
**Archaeological Evidence**: Rosetta Stone, Vindolanda tablets, oracle bones

---

## 🎓 PEDAGOGICAL BENEFITS

### Traditional History Teaching (What We Avoid):
❌ Memorize dates and names
❌ "Study" events passively
❌ Generic textbook questions
❌ No clear real-world application
❌ Recall-based assessment

### EduForger History Approach (What We Do):
✅ **Apply** historical knowledge to authentic decisions
✅ **Analyze** multiple historical parallels
✅ **Compare** different historical approaches and outcomes
✅ **Evaluate** evidence and sources critically
✅ **Predict** outcomes based on historical patterns
✅ **Argue** for decisions using historical evidence
✅ **Experience** history as professionals use it

---

## 🎯 EXAMPLE: COMPLETE TASK USING FRAMEWORK

### Scenario Archetype: #1 Diplomatic Negotiation

**YOU ARE**: French foreign minister, March 1778

**CONTEXT**: American colonies have been fighting Britain for 2 years. Benjamin Franklin has arrived in Paris seeking French military and financial support for the American Revolution. King Louis XVI asks for your analysis.

**HISTORICAL PARALLELS TO CONSIDER**:
1. **Seven Years' War (1756-1763)**: France lost to Britain, ceded Canada and India. Cost: 1.3 billion livres, humiliating defeat. Revenge motive strong.
2. **Austrian Succession War (1740-1748)**: French support for Bavaria against Austria. Outcome: expensive, inconclusive, no territorial gains.
3. **English Civil War (1642-1651)**: European powers' intervention in internal British conflicts. Mixed outcomes.
4. **Dutch Revolt (1568-1648)**: Spain's long, costly attempt to suppress rebellion. Eventually failed despite superior resources.

**PRIMARY SOURCES PROVIDED**:
- Franklin's proposal: "France provides 25 ships of the line, 6 million livres annually, military advisors. In return: trade privileges, potential Caribbean territorial gains if Britain defeated."
- Intelligence reports: "British Navy stretched thin (American blockade + Caribbean + India). Army morale low after Saratoga defeat (Oct 1777). Parliament divided on war."
- Treasury assessment: "French finances strained. Current debt: 2 billion livres. Annual interest: 100 million livres. Supporting America: 200-300 million livres over 3-5 years."

**YOUR TASK**:
Analyze the historical precedents and current evidence to advise Louis XVI:

1. **What are the strategic advantages** of supporting American independence? (Use historical examples of successful interventions in rebellions)

2. **What are the risks** based on historical precedents? (Reference past French foreign interventions and their outcomes)

3. **What guarantees should France demand** from the Americans? (Compare to historical alliance treaties: what terms protected the supporting power?)

4. **Rank these 4 options** by likelihood of success (justify using historical parallels):
   - A) Full military alliance now (commit ships and troops immediately)
   - B) Financial support only initially (loans and weapons, but no troops yet)
   - C) Delay until American victory seems certain (wait for more proof)
   - D) Reject involvement entirely (avoid Seven Years' War repeat)

**SUCCESS CRITERIA**: Your answer must:
- Reference at least 2 specific historical parallels
- Compare outcomes of different intervention approaches
- Identify key differences between historical cases and current situation
- Make a recommendation backed by historical evidence
- Acknowledge risks based on historical precedents

---

## 🔥 THE ULTIMATE TEST

**Ask yourself**: Would a professional historian/strategist/curator **ACTUALLY** need to analyze these historical examples to make this decision?

✅ YES: Authentic task
❌ NO: Fake "textbook question" disguised as scenario

---

## 📊 IMPLEMENTATION STATUS

✅ **COMPLETED**:
- 12 scenario archetypes defined and implemented
- 5 core knowledge domains integrated
- Historical Inquiry Framework established
- Diversity requirements specified
- Primary source integration guidelines
- Enhanced prompt modules (85,824 characters)
- Tested and validated in modular template system

🎯 **IN PRODUCTION**:
- All history tasks generated through EduForger now use this framework
- AI receives comprehensive guidance for creating authentic historical tasks
- Students experience history as professionals use it

---

## 📚 RELATED DOCUMENTATION

- `/backend/MODULAR_TEMPLATE_SYSTEM.md` - Overall template architecture
- `/backend/src/genai/prompts/modules/history/source_types.md` - Full archetype details
- `/backend/src/genai/prompts/modules/history/scenario_patterns.md` - Scenario examples
- `/backend/src/genai/prompts/modules/history/evidence_requirements.md` - Evidence specifications

---

## ✨ CONCLUSION

This framework transforms history education from passive memorization to active professional historical thinking. Students don't "study" history—they **USE** history the way diplomats, judges, commanders, curators, and policymakers actually use it: to analyze precedents, compare approaches, evaluate evidence, and make critical decisions.

**Every history task = Real professional work using real historical evidence.**

---

*Framework Version: 2.0*
*Last Updated: 2026-01-15*
*Status: ✅ Production Ready*
