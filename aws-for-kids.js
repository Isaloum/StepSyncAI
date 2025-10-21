const fs = require('fs');
const path = require('path');

class AWSForKids {
    constructor(dataFile = 'aws-learning-progress.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
        this.initializeConcepts();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
        return {
            progress: {},
            quizScores: [],
            completedLessons: [],
            totalStudyTime: 0
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving data:', error.message);
            return false;
        }
    }

    initializeConcepts() {
        this.concepts = {
            'ec2': {
                name: 'EC2 (Elastic Compute Cloud)',
                emoji: '🖥️',
                simple: 'EC2 is like renting a computer in the cloud!',
                explanation: `Imagine you want to build with LEGO blocks, but you don't have enough blocks at home.
EC2 is like going to a LEGO store where you can rent as many blocks as you need!

When you need a computer to run your programs, instead of buying a big expensive computer,
you can "rent" one from Amazon's huge warehouse of computers. You can:
- Make it bigger when you need more power (like getting more LEGO blocks)
- Make it smaller when you don't need as much
- Turn it off when you're done (and stop paying for it!)
- Choose different types for different jobs

Real Exam Info:
- EC2 provides resizable compute capacity
- You pay only for what you use
- Different instance types (t2, m5, c5, etc.) for different workloads
- Can scale up/down based on demand
- Located in Availability Zones for high availability`,
                category: 'Compute',
                examWeight: 'HIGH'
            },
            's3': {
                name: 'S3 (Simple Storage Service)',
                emoji: '🧸',
                simple: 'S3 is like a magical toy box that never gets full!',
                explanation: `Imagine you have a toy box, but it's SUPER special:
- It can hold unlimited toys (files, photos, videos)
- Your toys never break or get lost
- You can access your toys from anywhere in the world
- You can share specific toys with friends
- It's organized into different boxes (buckets)

In S3, you can store:
- Pictures and videos
- Backups of important files
- Websites
- Big data for analysis

Real Exam Info:
- Object storage with 99.999999999% (11 9's) durability
- Organized into buckets (containers)
- Each object can be 0 bytes to 5TB
- Different storage classes (Standard, IA, Glacier) for cost optimization
- Used for backups, archives, data lakes, websites
- Can host static websites
- Supports versioning and lifecycle policies`,
                category: 'Storage',
                examWeight: 'HIGH'
            },
            'iam': {
                name: 'IAM (Identity and Access Management)',
                emoji: '🔐',
                simple: 'IAM is like being in charge of who gets keys to what rooms!',
                explanation: `Think of your house with many rooms. IAM is like being the parent who decides:
- Who gets a key to which room (permissions)
- What they can do in that room (policies)
- When they can use the key (conditions)

For example:
- Your little brother can play in the playroom but not the kitchen
- Your friend can read books in the library but can't take them home
- You can use the computer but only for homework

Real Exam Info:
- IAM controls who can access what in AWS
- Users: Individual people or services
- Groups: Collection of users (like "developers" or "admins")
- Roles: Temporary permissions for AWS services
- Policies: JSON documents that define permissions
- Best Practice: Least Privilege (only give minimum needed permissions)
- MFA (Multi-Factor Authentication) adds extra security
- Root account should never be used for daily tasks`,
                category: 'Security',
                examWeight: 'HIGH'
            },
            'vpc': {
                name: 'VPC (Virtual Private Cloud)',
                emoji: '🏰',
                simple: 'VPC is like building your own private playground with fences!',
                explanation: `Imagine you're building a private playground just for you and your friends:
- You put up fences to keep it private (security)
- You decide who can come in through the gate (security groups)
- You create different areas: swings, sandbox, slides (subnets)
- Some areas are for everyone to see (public subnets)
- Some areas are private just for you (private subnets)

Real Exam Info:
- VPC is your own isolated network in AWS
- You control IP address ranges
- Subnets divide your VPC (public and private)
- Internet Gateway connects to the internet
- Route Tables control where traffic goes
- Security Groups = firewall for instances
- NACLs (Network ACLs) = firewall for subnets
- VPC Peering connects VPCs together`,
                category: 'Networking',
                examWeight: 'MEDIUM'
            },
            'rds': {
                name: 'RDS (Relational Database Service)',
                emoji: '📚',
                simple: 'RDS is like having perfectly organized bookshelves!',
                explanation: `Think of a library with perfectly organized shelves:
- Every book has its place (structured data)
- You can quickly find any book (queries)
- The librarian keeps everything organized (AWS manages it)
- If a shelf breaks, there's a backup (automated backups)

RDS is great for storing:
- User accounts and passwords
- Shopping cart items
- Game scores
- Any information that needs to be organized in tables

Real Exam Info:
- Managed relational database service
- Supports: MySQL, PostgreSQL, Oracle, SQL Server, MariaDB, Aurora
- AWS handles: backups, patching, scaling, monitoring
- Multi-AZ for high availability
- Read Replicas for better performance
- Automated backups (up to 35 days retention)
- You manage: data, queries, optimization`,
                category: 'Database',
                examWeight: 'HIGH'
            },
            'lambda': {
                name: 'Lambda',
                emoji: '⚡',
                simple: 'Lambda is like having magical helpers who appear when you need them!',
                explanation: `Imagine you have invisible helpers:
- They only appear when you need them (event-driven)
- They do one job really quickly
- They disappear when done
- You only pay for the seconds they work!

Examples:
- When someone uploads a photo, a helper resizes it
- When you press a doorbell, a helper rings the bell
- When you get an email, a helper sorts it

Real Exam Info:
- Serverless compute service (no servers to manage!)
- Pay only for compute time used
- Automatically scales
- Triggered by events (S3 upload, API call, schedule, etc.)
- Maximum execution time: 15 minutes
- Supports many languages: Python, Node.js, Java, Go, etc.
- Great for: microservices, data processing, backends`,
                category: 'Compute',
                examWeight: 'MEDIUM'
            },
            'cloudwatch': {
                name: 'CloudWatch',
                emoji: '👁️',
                simple: 'CloudWatch is like security cameras watching everything!',
                explanation: `Imagine your house has cameras everywhere:
- They watch what's happening (monitoring)
- They alert you if something's wrong (alarms)
- They save recordings so you can check later (logs)
- They tell you if a door is open or closed (metrics)

CloudWatch watches:
- Is my computer running okay?
- Is my website working?
- How many people are using my app?
- Are there any errors?

Real Exam Info:
- Monitoring and observability service
- Collects metrics, logs, and events
- CloudWatch Alarms notify you of issues
- CloudWatch Logs stores log files
- Metrics: CPU usage, network traffic, disk I/O
- Can trigger actions (like scaling)
- Dashboards for visualization
- Default monitoring: 5-minute intervals
- Detailed monitoring: 1-minute intervals (costs extra)`,
                category: 'Management',
                examWeight: 'MEDIUM'
            },
            'route53': {
                name: 'Route 53',
                emoji: '🗺️',
                simple: 'Route 53 is like a GPS that helps people find your website!',
                explanation: `When you want to visit your friend's house, you need their address.
Route 53 is like a magical address book for the internet:
- You type "www.myfavoritewebsite.com"
- Route 53 translates it to the actual computer address (like GPS coordinates)
- It finds the fastest route to get there
- If one road is blocked, it finds another way!

Real Exam Info:
- DNS (Domain Name System) service
- Translates domain names to IP addresses
- Routing policies: Simple, Weighted, Latency, Failover, Geolocation
- Health checks monitor endpoint health
- 100% uptime SLA
- Can register domain names
- Integrates with other AWS services
- Route 53 = DNS on port 53`,
                category: 'Networking',
                examWeight: 'LOW'
            },
            'cloudfront': {
                name: 'CloudFront',
                emoji: '🚀',
                simple: 'CloudFront is like having copies of your toys in many places!',
                explanation: `Imagine you live in New York but have a friend in Tokyo:
- Instead of shipping a toy every time (slow!)
- You keep extra copies of toys near your friend (fast!)
- They get the toy from the nearest location

CloudFront does this with websites and videos:
- Copies your content to locations worldwide
- People get it from the nearest location
- Everything loads super fast!
- Great for videos, images, and websites

Real Exam Info:
- Content Delivery Network (CDN)
- Caches content at edge locations worldwide
- Reduces latency for users
- Integrates with S3, EC2, Load Balancers
- DDoS protection included
- Can serve both static and dynamic content
- Supports HTTPS
- Pay for data transfer out`,
                category: 'Networking',
                examWeight: 'LOW'
            },
            'ebs': {
                name: 'EBS (Elastic Block Store)',
                emoji: '💾',
                simple: 'EBS is like a backpack for your cloud computer!',
                explanation: `When you go to school, you need a backpack to carry your stuff:
- Your computer (EC2) needs storage too!
- EBS is like a backpack that stores your files
- You can make it bigger when you need more space
- If you switch computers, you can move your backpack
- It saves everything even if you turn off the computer

Real Exam Info:
- Block storage for EC2 instances
- Persistent storage (data survives instance termination)
- Types: gp2/gp3 (general), io1/io2 (high performance), st1/sc1 (big data)
- Snapshots backup EBS volumes to S3
- Can attach/detach from instances
- Encryption available
- Tied to a specific Availability Zone
- Pay for provisioned capacity`,
                category: 'Storage',
                examWeight: 'MEDIUM'
            },
            'elb': {
                name: 'ELB (Elastic Load Balancer)',
                emoji: '⚖️',
                simple: 'ELB is like a teacher dividing kids into groups!',
                explanation: `Imagine there's one ice cream truck and 100 kids:
- Everyone rushing to one truck would be chaos!
- A teacher could split kids into 4 groups of 25
- Each group goes to a different truck
- Everyone gets ice cream faster!

ELB does this for websites:
- Splits visitors across multiple computers
- Makes sure no computer gets overwhelmed
- If one computer breaks, sends people to working ones
- Everyone gets fast service!

Real Exam Info:
- Distributes traffic across multiple targets
- Types: Application LB (Layer 7/HTTP), Network LB (Layer 4/TCP), Gateway LB
- Increases availability and fault tolerance
- Health checks ensure traffic goes to healthy instances
- Auto-scales to handle traffic
- Integrates with Auto Scaling
- Cross-zone load balancing available`,
                category: 'Networking',
                examWeight: 'MEDIUM'
            },
            'autoscaling': {
                name: 'Auto Scaling',
                emoji: '📈',
                simple: 'Auto Scaling is like calling more friends when you need help!',
                explanation: `Imagine you're cleaning your room:
- If it's just a little messy, you can do it alone
- If it's REALLY messy, you call friends to help
- When you're done, friends go home
- You only share your snacks with friends while they help!

Auto Scaling for computers:
- When lots of people visit your website, add more computers
- When fewer people visit, remove computers
- You only pay for what you need!

Real Exam Info:
- Automatically adjusts number of EC2 instances
- Scaling policies: Target Tracking, Step, Simple, Scheduled
- Maintains desired capacity
- Works with CloudWatch metrics
- Launch configurations/templates define instance settings
- Can scale across multiple Availability Zones
- Free service (you pay only for instances)
- Increases availability and optimizes costs`,
                category: 'Compute',
                examWeight: 'MEDIUM'
            },
            'sns': {
                name: 'SNS (Simple Notification Service)',
                emoji: '📢',
                simple: 'SNS is like a loudspeaker that tells everyone something happened!',
                explanation: `Imagine you're having a birthday party:
- Instead of calling each friend one by one
- You use a loudspeaker to announce to everyone at once!
- Everyone hears the message at the same time

SNS sends messages:
- Text messages to phones
- Emails to inboxes
- Notifications to apps
- All at once to many people!

Real Exam Info:
- Pub/Sub messaging service (Publisher/Subscriber)
- One message to many recipients (fan-out)
- Protocols: SMS, email, HTTP/S, SQS, Lambda
- Topics organize messages
- Pay per message
- Immediate delivery (push)
- Use cases: alerts, notifications, mobile push`,
                category: 'Application Integration',
                examWeight: 'LOW'
            },
            'sqs': {
                name: 'SQS (Simple Queue Service)',
                emoji: '📬',
                simple: 'SQS is like a mailbox that holds messages until you\'re ready!',
                explanation: `Think of your mailbox at home:
- Mail carrier puts letters in (send messages)
- Letters wait safely in the box
- You check when you're ready (receive messages)
- You read them one at a time

SQS holds messages:
- One app sends messages
- Another app processes them when ready
- If app is busy, messages wait
- No messages get lost!

Real Exam Info:
- Fully managed message queue service
- Decouples application components
- Types: Standard (best effort ordering) and FIFO (guaranteed order)
- Messages retained up to 14 days
- Unlimited throughput (Standard)
- Pull-based (applications poll for messages)
- Visibility timeout prevents duplicate processing
- Dead Letter Queue for failed messages`,
                category: 'Application Integration',
                examWeight: 'LOW'
            },
            'dynamodb': {
                name: 'DynamoDB',
                emoji: '⚡',
                simple: 'DynamoDB is like a super-fast toy sorting machine!',
                explanation: `Imagine a magical toy box that:
- Finds any toy in milliseconds
- Never slows down, even with millions of toys
- Automatically makes more space when needed
- Works perfectly even if one section breaks

DynamoDB stores data super fast:
- Games use it for player scores
- Websites use it for shopping carts
- Apps use it for user data
- It's always lightning fast!

Real Exam Info:
- Fully managed NoSQL database
- Single-digit millisecond latency
- Auto-scaling capacity
- Multi-region, multi-master replication
- Tables, items, attributes (not rows/columns)
- Primary key required (partition key or partition + sort key)
- Streams for change data capture
- Good for: mobile, web, gaming, IoT
- Pay per read/write or on-demand pricing`,
                category: 'Database',
                examWeight: 'MEDIUM'
            },
            'cloudformation': {
                name: 'CloudFormation',
                emoji: '📋',
                simple: 'CloudFormation is like a LEGO instruction manual for the cloud!',
                explanation: `When you build a LEGO set:
- You follow instructions step by step
- The manual tells you exactly what pieces to use
- You can rebuild it the same way anytime!

CloudFormation is instructions for building cloud stuff:
- Write down what you want (a template)
- CloudFormation builds everything for you
- You can create the same setup over and over
- Delete everything at once when done!

Real Exam Info:
- Infrastructure as Code (IaC) service
- Templates written in JSON or YAML
- Defines AWS resources and their properties
- Stacks = collection of resources managed together
- Automatic rollback on errors
- Version control your infrastructure
- Free (pay only for resources created)
- StackSets deploy across multiple accounts/regions`,
                category: 'Management',
                examWeight: 'LOW'
            },
            'elasticache': {
                name: 'ElastiCache',
                emoji: '🏃',
                simple: 'ElastiCache is like remembering answers instead of solving problems again!',
                explanation: `Imagine doing math homework:
- First time: 235 + 467 = ? (you calculate = 702)
- Second time: 235 + 467 = ? (you remember = 702!)
- Much faster to remember than calculate again!

ElastiCache remembers answers:
- First visit: load from database (slow)
- Next visits: grab from memory (super fast!)
- Great for things that don't change often

Real Exam Info:
- In-memory caching service
- Engines: Redis and Memcached
- Microsecond latency
- Reduces database load
- Use cases: session storage, leaderboards, caching
- Redis: persistence, replication, sorting
- Memcached: simple, multi-threaded
- Improves application performance`,
                category: 'Database',
                examWeight: 'LOW'
            },
            'pricing': {
                name: 'AWS Pricing Models',
                emoji: '💰',
                simple: 'AWS has different ways to pay, like choosing how to buy candy!',
                explanation: `Imagine buying candy:
1. Pay as you eat (On-Demand): Buy one piece when you want it
2. Monthly subscription (Reserved): Buy a candy box, cheaper per piece
3. Auction (Spot): Buy leftover candy super cheap, but it might run out
4. All-you-can-eat (Savings Plans): Pay monthly, eat lots, save money

Real Exam Info:
- ON-DEMAND: Pay by hour/second, no commitment, highest cost
- RESERVED: 1 or 3 year commitment, up to 75% savings
  - Standard: best savings, can't change
  - Convertible: can change instance type
- SPOT: Bid on unused capacity, up to 90% savings, can be terminated
- SAVINGS PLANS: Commit to usage amount, flexible, up to 72% savings
- FREE TIER: Limited free usage for 12 months (some services always free)`,
                category: 'Billing',
                examWeight: 'HIGH'
            },
            'well-architected': {
                name: 'Well-Architected Framework',
                emoji: '🏗️',
                simple: 'Building things the smart way, like following rules for a strong house!',
                explanation: `When building a house, you want it to be:
- STRONG (won't fall down)
- SAFE (locked doors)
- EFFICIENT (doesn't waste electricity)
- COMFY (nice to live in)
- AFFORDABLE (doesn't cost too much)
- GREEN (good for Earth)

AWS has rules for building cloud things well!

Real Exam Info - 6 Pillars:
1. OPERATIONAL EXCELLENCE: Run and monitor systems
   - Automation, small changes, documentation
2. SECURITY: Protect data and systems
   - IAM, encryption, least privilege
3. RELIABILITY: System works when needed
   - Multi-AZ, backups, auto-recovery
4. PERFORMANCE EFFICIENCY: Use resources efficiently
   - Right instance types, serverless, caching
5. COST OPTIMIZATION: Avoid unnecessary costs
   - Right-sizing, spot instances, monitoring
6. SUSTAINABILITY: Minimize environmental impact
   - Efficient resources, reduce waste`,
                category: 'Best Practices',
                examWeight: 'MEDIUM'
            },
            'support-plans': {
                name: 'AWS Support Plans',
                emoji: '🆘',
                simple: 'Different levels of help, like choosing how much help you want with homework!',
                explanation: `Getting help with homework:
- BASIC: Use the textbook (free)
- DEVELOPER: Email the teacher, wait a day
- BUSINESS: Call the teacher anytime during school
- ENTERPRISE: Personal tutor 24/7!

Real Exam Info:
- BASIC (Free):
  - Documentation, whitepapers, support forums
  - AWS Trusted Advisor (7 core checks)
  - AWS Personal Health Dashboard

- DEVELOPER ($29+/month):
  - Email support during business hours
  - Response: 12-24 hours
  - One primary contact

- BUSINESS ($100+/month):
  - 24/7 phone, email, chat support
  - Response: < 1 hour for urgent issues
  - Full Trusted Advisor checks
  - Unlimited contacts

- ENTERPRISE ($15,000+/month):
  - Technical Account Manager (TAM)
  - Response: < 15 minutes for critical issues
  - Concierge support team
  - Infrastructure event management`,
                category: 'Billing',
                examWeight: 'LOW'
            },
            'shared-responsibility': {
                name: 'Shared Responsibility Model',
                emoji: '🤝',
                simple: 'AWS and you both have jobs, like parents and kids sharing chores!',
                explanation: `In a house:
- Parents: Fix the house, maintain appliances (AWS's job)
- Kids: Keep room clean, lock their diary (Your job)

AWS is responsible for security OF the cloud:
- The buildings, computers, networks
- Keeping everything running

You are responsible for security IN the cloud:
- Your data, your apps
- Who can access what
- Encryption, backups

Real Exam Info:
AWS Responsibility (Security OF the cloud):
- Physical security of data centers
- Hardware and infrastructure
- Network infrastructure
- Managed services operation

Customer Responsibility (Security IN the cloud):
- Customer data
- Platform, applications, IAM
- Operating system, network, firewall
- Encryption (data at rest and in transit)
- Network traffic protection

Shared: Patch management, configuration management, awareness & training`,
                category: 'Security',
                examWeight: 'HIGH'
            }
        };

        this.quizQuestions = [
            {
                question: "What does EC2 stand for?",
                options: [
                    "Elastic Cloud Computer",
                    "Elastic Compute Cloud",
                    "Electronic Computer Cloud",
                    "Easy Compute Cloud"
                ],
                correct: 1,
                explanation: "EC2 stands for Elastic Compute Cloud - it provides resizable compute capacity in the cloud."
            },
            {
                question: "Which AWS service is like a 'magical toy box that never gets full'?",
                options: ["EC2", "S3", "RDS", "Lambda"],
                correct: 1,
                explanation: "S3 (Simple Storage Service) can store unlimited amounts of data, like a toy box that never gets full!"
            },
            {
                question: "What is the purpose of IAM in AWS?",
                options: [
                    "To store files",
                    "To run computers",
                    "To control who can access what",
                    "To monitor applications"
                ],
                correct: 2,
                explanation: "IAM (Identity and Access Management) controls who can access what in AWS - like giving keys to rooms!"
            },
            {
                question: "Which pricing model offers up to 90% savings but instances can be terminated?",
                options: ["On-Demand", "Reserved", "Spot", "Savings Plans"],
                correct: 2,
                explanation: "Spot Instances offer up to 90% savings but can be terminated when AWS needs the capacity back."
            },
            {
                question: "Which service is 'serverless' and runs code only when needed?",
                options: ["EC2", "Lambda", "RDS", "EBS"],
                correct: 1,
                explanation: "Lambda is serverless - it runs your code only when triggered, like magical helpers that appear when needed!"
            },
            {
                question: "What is the durability of S3 Standard storage?",
                options: [
                    "99.9%",
                    "99.99%",
                    "99.999999999% (11 nines)",
                    "100%"
                ],
                correct: 2,
                explanation: "S3 Standard offers 99.999999999% (11 nines) durability, meaning your data is extremely safe!"
            },
            {
                question: "Which service acts like 'security cameras watching everything'?",
                options: ["IAM", "CloudWatch", "CloudFront", "Route 53"],
                correct: 1,
                explanation: "CloudWatch monitors your AWS resources and applications, like security cameras watching everything!"
            },
            {
                question: "In the Shared Responsibility Model, who is responsible for physical security of data centers?",
                options: [
                    "Customer",
                    "AWS",
                    "Both",
                    "Third-party vendors"
                ],
                correct: 1,
                explanation: "AWS is responsible for security OF the cloud, including physical security of data centers."
            },
            {
                question: "What does a VPC provide in AWS?",
                options: [
                    "Virtual Private Cloud - your isolated network",
                    "Very Powerful Computer",
                    "Verified Personal Code",
                    "Virtual Processing Center"
                ],
                correct: 0,
                explanation: "VPC (Virtual Private Cloud) gives you an isolated network in AWS - like your own private playground!"
            },
            {
                question: "Which service would you use to distribute content globally for faster access?",
                options: ["S3", "CloudFront", "Route 53", "Lambda"],
                correct: 1,
                explanation: "CloudFront is a CDN that caches content at edge locations worldwide for faster access."
            },
            {
                question: "What is the main benefit of Auto Scaling?",
                options: [
                    "Cheaper storage",
                    "Better security",
                    "Automatically adjusts capacity based on demand",
                    "Faster internet"
                ],
                correct: 2,
                explanation: "Auto Scaling automatically adds or removes EC2 instances based on demand - like calling friends to help when needed!"
            },
            {
                question: "Which database service is best for fast NoSQL operations?",
                options: ["RDS", "DynamoDB", "ElastiCache", "S3"],
                correct: 1,
                explanation: "DynamoDB is a fully managed NoSQL database with single-digit millisecond latency."
            },
            {
                question: "What does ELB do?",
                options: [
                    "Stores data",
                    "Distributes traffic across multiple targets",
                    "Monitors resources",
                    "Provides DNS services"
                ],
                correct: 1,
                explanation: "ELB (Elastic Load Balancer) distributes traffic across multiple targets - like dividing kids into groups!"
            },
            {
                question: "How many pillars are in the Well-Architected Framework?",
                options: ["4", "5", "6", "7"],
                correct: 2,
                explanation: "There are 6 pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability."
            },
            {
                question: "Which support plan includes a Technical Account Manager (TAM)?",
                options: ["Basic", "Developer", "Business", "Enterprise"],
                correct: 3,
                explanation: "Only the Enterprise support plan includes a dedicated Technical Account Manager (TAM)."
            },
            {
                question: "What is CloudFormation used for?",
                options: [
                    "Monitoring clouds",
                    "Infrastructure as Code",
                    "Content delivery",
                    "Database management"
                ],
                correct: 1,
                explanation: "CloudFormation is Infrastructure as Code - like LEGO instructions for building cloud resources!"
            },
            {
                question: "Which service is used for pub/sub messaging (one to many)?",
                options: ["SQS", "SNS", "Lambda", "CloudWatch"],
                correct: 1,
                explanation: "SNS (Simple Notification Service) sends one message to many subscribers - like a loudspeaker!"
            },
            {
                question: "What type of storage is EBS?",
                options: [
                    "Object storage",
                    "Block storage",
                    "File storage",
                    "Archive storage"
                ],
                correct: 1,
                explanation: "EBS (Elastic Block Store) provides block storage for EC2 instances - like a backpack for your computer!"
            },
            {
                question: "Which pricing option requires a 1 or 3 year commitment?",
                options: ["On-Demand", "Reserved", "Spot", "Free Tier"],
                correct: 1,
                explanation: "Reserved Instances require a 1 or 3 year commitment in exchange for significant savings (up to 75%)."
            },
            {
                question: "In the Shared Responsibility Model, who is responsible for customer data?",
                options: [
                    "AWS",
                    "Customer",
                    "Both",
                    "It depends on the service"
                ],
                correct: 1,
                explanation: "Customers are always responsible for their own data - it's part of security IN the cloud."
            }
        ];
    }

    learn(topicKey) {
        const concept = this.concepts[topicKey];

        if (!concept) {
            console.log('❌ Topic not found! Use "list" to see available topics.');
            return;
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`${concept.emoji}  ${concept.name}`);
        console.log('═'.repeat(70));
        console.log(`\n📖 SIMPLE EXPLANATION:`);
        console.log(concept.simple);
        console.log(`\n🎈 DETAILED EXPLANATION:`);
        console.log(concept.explanation);
        console.log(`\n📊 Category: ${concept.category}`);
        console.log(`⚠️  Exam Importance: ${concept.examWeight}`);
        console.log('═'.repeat(70));

        // Track progress
        if (!this.data.completedLessons.includes(topicKey)) {
            this.data.completedLessons.push(topicKey);
            this.saveData();
            console.log(`\n✅ Topic marked as learned! (${this.data.completedLessons.length}/${Object.keys(this.concepts).length} topics completed)`);
        }
    }

    listTopics(category = null) {
        console.log('\n' + '═'.repeat(70));
        console.log('📚 AWS CONCEPTS - Learn Like You\'re 5 Years Old!');
        console.log('═'.repeat(70));

        const categories = {};

        // Group by category
        Object.entries(this.concepts).forEach(([key, concept]) => {
            if (category && concept.category.toLowerCase() !== category.toLowerCase()) {
                return;
            }
            if (!categories[concept.category]) {
                categories[concept.category] = [];
            }
            categories[concept.category].push({ key, ...concept });
        });

        // Display by category
        Object.entries(categories).forEach(([cat, concepts]) => {
            console.log(`\n📁 ${cat.toUpperCase()}`);
            console.log('─'.repeat(70));
            concepts.forEach(concept => {
                const learned = this.data.completedLessons.includes(concept.key) ? '✅' : '⬜';
                console.log(`${learned} ${concept.emoji} ${concept.key.padEnd(20)} - ${concept.name}`);
                console.log(`   Importance: ${concept.examWeight} | ${concept.simple}`);
            });
        });

        console.log('\n' + '═'.repeat(70));
        console.log(`Progress: ${this.data.completedLessons.length}/${Object.keys(this.concepts).length} topics completed`);
        console.log('Use: node aws-for-kids.js learn <topic-key> to learn a topic');
        console.log('═'.repeat(70));
    }

    quiz(numQuestions = 5) {
        if (numQuestions > this.quizQuestions.length) {
            numQuestions = this.quizQuestions.length;
        }

        // Shuffle and select questions
        const shuffled = [...this.quizQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, numQuestions);

        console.log('\n' + '═'.repeat(70));
        console.log('🎯 AWS CLOUD PRACTITIONER PRACTICE QUIZ');
        console.log('═'.repeat(70));
        console.log(`\nYou will be asked ${numQuestions} questions.`);
        console.log('Type the number of your answer (0-3) and press Enter.\n');

        let score = 0;
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        let currentQ = 0;

        const askQuestion = () => {
            if (currentQ >= selectedQuestions.length) {
                const percentage = (score / numQuestions * 100).toFixed(1);
                console.log('\n' + '═'.repeat(70));
                console.log(`🎉 QUIZ COMPLETE!`);
                console.log(`Score: ${score}/${numQuestions} (${percentage}%)`);

                if (percentage >= 70) {
                    console.log('🌟 Great job! You\'re ready for the exam!');
                } else if (percentage >= 50) {
                    console.log('📚 Good effort! Keep studying to improve!');
                } else {
                    console.log('💪 Keep learning! Review the topics and try again!');
                }
                console.log('═'.repeat(70));

                // Save score
                this.data.quizScores.push({
                    date: new Date().toISOString(),
                    score: score,
                    total: numQuestions,
                    percentage: percentage
                });
                this.saveData();

                readline.close();
                return;
            }

            const q = selectedQuestions[currentQ];
            console.log(`\n❓ Question ${currentQ + 1}/${numQuestions}:`);
            console.log(q.question);
            console.log('');
            q.options.forEach((opt, idx) => {
                console.log(`  ${idx}. ${opt}`);
            });

            readline.question('\nYour answer (0-3): ', (answer) => {
                const answerNum = parseInt(answer);

                if (answerNum === q.correct) {
                    console.log('✅ Correct!');
                    score++;
                } else {
                    console.log(`❌ Wrong. The correct answer was: ${q.options[q.correct]}`);
                }
                console.log(`💡 ${q.explanation}`);

                currentQ++;
                askQuestion();
            });
        };

        askQuestion();
    }

    progress() {
        const totalTopics = Object.keys(this.concepts).length;
        const completedTopics = this.data.completedLessons.length;
        const percentage = (completedTopics / totalTopics * 100).toFixed(1);

        console.log('\n' + '═'.repeat(70));
        console.log('📊 YOUR LEARNING PROGRESS');
        console.log('═'.repeat(70));
        console.log(`\nTopics Completed: ${completedTopics}/${totalTopics} (${percentage}%)`);

        // Progress bar
        const barLength = 50;
        const filled = Math.round(barLength * completedTopics / totalTopics);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        console.log(`[${bar}]`);

        // Quiz history
        if (this.data.quizScores.length > 0) {
            console.log(`\n🎯 Quiz History (Last 5):`);
            console.log('─'.repeat(70));
            const recent = this.data.quizScores.slice(-5).reverse();
            recent.forEach((quiz, idx) => {
                const date = new Date(quiz.date).toLocaleDateString();
                console.log(`${date}: ${quiz.score}/${quiz.total} (${quiz.percentage}%)`);
            });

            const avgScore = this.data.quizScores.reduce((sum, q) => sum + parseFloat(q.percentage), 0) / this.data.quizScores.length;
            console.log(`\nAverage Quiz Score: ${avgScore.toFixed(1)}%`);
        }

        // Recommendations
        console.log(`\n💡 Next Steps:`);
        if (completedTopics < totalTopics) {
            console.log(`   - Complete ${totalTopics - completedTopics} remaining topics`);
        }
        if (this.data.quizScores.length === 0) {
            console.log(`   - Take your first practice quiz!`);
        } else {
            const lastScore = this.data.quizScores[this.data.quizScores.length - 1];
            if (lastScore.percentage < 70) {
                console.log(`   - Review topics and retake quizzes (aim for 70%+)`);
            } else {
                console.log(`   - Keep practicing! You're doing great!`);
            }
        }

        console.log('═'.repeat(70));
    }

    studyGuide() {
        console.log('\n' + '═'.repeat(70));
        console.log('📖 AWS CLOUD PRACTITIONER EXAM STUDY GUIDE');
        console.log('═'.repeat(70));

        console.log(`
🎯 EXAM OVERVIEW:
   - Name: AWS Certified Cloud Practitioner (CLF-C02)
   - Duration: 90 minutes
   - Questions: 65 questions (50 scored, 15 unscored)
   - Format: Multiple choice and multiple response
   - Passing Score: 700/1000 (approximately 70%)
   - Cost: $100 USD
   - Validity: 3 years

📚 EXAM DOMAINS:

   1. Cloud Concepts (24%)
      - Define AWS Cloud and value proposition
      - Economics of cloud (cost savings, pricing models)
      - Cloud architecture design principles

   2. Security and Compliance (30%)
      - Shared Responsibility Model
      - AWS security and compliance concepts
      - Access management (IAM)
      - Security support resources

   3. Cloud Technology and Services (34%)
      - Deployment and operation in AWS
      - AWS global infrastructure
      - Core AWS services (Compute, Storage, Database, Networking)
      - Technology support resources

   4. Billing, Pricing, and Support (12%)
      - AWS pricing models
      - Billing and cost management tools
      - Support plans and resources

🌟 HIGH PRIORITY TOPICS (Study These First!):
   ⭐ EC2 - Elastic Compute Cloud
   ⭐ S3 - Simple Storage Service
   ⭐ IAM - Identity and Access Management
   ⭐ RDS - Relational Database Service
   ⭐ Pricing Models (On-Demand, Reserved, Spot, Savings Plans)
   ⭐ Shared Responsibility Model
   ⭐ Well-Architected Framework

💡 STUDY TIPS:
   1. Complete all ${Object.keys(this.concepts).length} topics in this app
   2. Take practice quizzes until you score 80%+
   3. Understand concepts, don't just memorize
   4. Use the simple explanations to build foundations
   5. Review exam-level details for each service
   6. Take AWS's free digital training courses
   7. Use AWS Free Tier to get hands-on practice

🔗 OFFICIAL AWS RESOURCES:
   - AWS Skill Builder (free courses)
   - AWS Whitepapers (read Cloud Best Practices)
   - AWS Free Tier (hands-on practice)
   - Official Exam Guide (download from AWS)

`);
        console.log('═'.repeat(70));
    }
}

// CLI Interface
function showHelp() {
    console.log(`
☁️  AWS FOR KIDS - Learn AWS Like You're 5 Years Old!
═══════════════════════════════════════════════════════════

Master AWS Cloud Practitioner exam concepts with simple explanations!

Commands:
  list [category]
      List all available AWS topics
      Optional: filter by category (compute, storage, database, etc.)
      Example: node aws-for-kids.js list
               node aws-for-kids.js list compute

  learn <topic>
      Learn about a specific AWS service or concept
      Example: node aws-for-kids.js learn ec2
               node aws-for-kids.js learn s3

  quiz [number]
      Take a practice quiz
      Optional: specify number of questions (default: 5)
      Example: node aws-for-kids.js quiz
               node aws-for-kids.js quiz 10

  progress
      View your learning progress and quiz scores

  guide
      View the AWS Cloud Practitioner exam study guide

  help
      Show this help message

═══════════════════════════════════════════════════════════
Start with: node aws-for-kids.js list
Then learn: node aws-for-kids.js learn ec2
Practice:   node aws-for-kids.js quiz
═══════════════════════════════════════════════════════════
`);
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const app = new AWSForKids();

    switch(command) {
        case 'list':
            const category = args[1] || null;
            app.listTopics(category);
            break;

        case 'learn':
            if (args.length < 2) {
                console.log('❌ Usage: learn <topic-key>');
                console.log('Use "list" to see available topics');
                break;
            }
            app.learn(args[1]);
            break;

        case 'quiz':
            const numQuestions = args[1] ? parseInt(args[1]) : 5;
            app.quiz(numQuestions);
            break;

        case 'progress':
            app.progress();
            break;

        case 'guide':
            app.studyGuide();
            break;

        case 'help':
        default:
            showHelp();
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = AWSForKids;
