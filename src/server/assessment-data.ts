/**
 * SkillBridge Assessment Question Bank & Learning Catalog
 * Contains structured question banks with adaptive difficulty tiers (EASY, MEDIUM, HARD)
 * and industry learning programs.
 */

export interface QuestionDef {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  explanation: string;
}

export interface AssessmentDef {
  id: string;
  title: string;
  skillName: string;
  category: "Technical" | "Aptitude" | "Soft Skills";
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  benchmarkScore: number;
  questions: QuestionDef[];
}

export const ASSESSMENTS_CATALOG: AssessmentDef[] = [
  {
    id: "assess-python",
    title: "Python Adaptive Assessment",
    skillName: "Python",
    category: "Technical",
    description: "Evaluates core syntax, data structures, functional patterns, OOP, and asynchronous programming.",
    durationMinutes: 20,
    totalQuestions: 10,
    benchmarkScore: 80,
    questions: [
      {
        id: "py-1",
        question: "Which built-in Python data structure provides average O(1) time complexity for key lookups?",
        options: ["List", "Tuple", "Dictionary", "Linked List"],
        correctAnswer: 2,
        difficulty: "EASY",
        topic: "Data Structures",
        explanation: "Python dictionaries use hash tables under the hood, yielding O(1) average lookup time.",
      },
      {
        id: "py-2",
        question: "What will `bool([])` evaluate to in Python?",
        options: ["True", "False", "None", "TypeError"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Core Syntax",
        explanation: "Empty sequences (lists, tuples, strings) evaluate to False in boolean contexts.",
      },
      {
        id: "py-3",
        question: "How do you create a generator in Python without using a generator expression?",
        options: ["Using the `return` keyword", "Using the `yield` keyword", "Using `async def`", "Using `@property`"],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Generators & Iterators",
        explanation: "Functions containing the `yield` keyword produce generator iterators.",
      },
      {
        id: "py-4",
        question: "What is the primary role of the Global Interpreter Lock (GIL) in standard CPython?",
        options: [
          "Prevents multiple threads from executing Python bytecode simultaneously",
          "Accelerates garbage collection across CPU cores",
          "Encrypts bytecode during runtime",
          "Enforces type safety in runtime execution"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Concurrency & CPython",
        explanation: "CPython's GIL ensures only one native thread executes Python bytecode at any single moment.",
      },
      {
        id: "py-5",
        question: "In Python decorators, what is the purpose of `@functools.wraps(func)`?",
        options: [
          "Compiles the wrapped function to C",
          "Preserves original function name and docstring metadata",
          "Makes the decorator thread-safe",
          "Caches function return values"
        ],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Decorators & Metaprogramming",
        explanation: "`functools.wraps` copies over __name__, __doc__, and annotations from the original function.",
      },
      {
        id: "py-6",
        question: "What happens when you pass a mutable default argument like `def add_item(item, items=[]):` in Python?",
        options: [
          "A new list is created on every call",
          "The list is created once at definition time and shared across subsequent calls",
          "Python raises a SyntaxError",
          "The argument is treated as an immutable tuple"
        ],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Functions & Scope",
        explanation: "Default parameter values are evaluated once when the function definition is executed.",
      },
      {
        id: "py-7",
        question: "In `asyncio`, what does `asyncio.gather(*tasks)` do?",
        options: [
          "Cancels all concurrent tasks",
          "Executes awaitable objects concurrently and returns their aggregated results",
          "Locks the event loop until the first task fails",
          "Converts async functions into multithreaded workers"
        ],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Async & Event Loop",
        explanation: "`asyncio.gather` runs awaitables concurrently in the event loop and collects their return values in order.",
      },
      {
        id: "py-8",
        question: "How does Python resolve method inheritance ambiguities in multiple inheritance?",
        options: [
          "Depth-First Search",
          "C3 Linearization (Method Resolution Order / MRO)",
          "Breadth-First Search with tie-breaking",
          "Alphabetical class name hierarchy"
        ],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "OOP & Metaclasses",
        explanation: "Python utilizes the C3 Linearization algorithm to determine a deterministic MRO.",
      },
      {
        id: "py-9",
        question: "What is the memory management mechanism for cyclic references in Python?",
        options: [
          "Simple reference counting alone",
          "Generational cyclic garbage collector (gc module)",
          "Manual memory deallocation",
          "JVM-style mark and sweep"
        ],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Memory & GC",
        explanation: "CPython combines reference counting with a generational cyclic garbage collector for reference cycles.",
      },
      {
        id: "py-10",
        question: "Which dunder method is invoked when an attribute lookup fails through ordinary class hierarchy in Python?",
        options: ["__getattribute__", "__getattr__", "__setattr__", "__getitem__"],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Descriptors & Dunder Methods",
        explanation: "`__getattr__` is called only when an attribute is not found in the object dictionary or class tree.",
      },
    ],
  },
  {
    id: "assess-sql",
    title: "SQL & Relational Database Assessment",
    skillName: "SQL",
    category: "Technical",
    description: "Evaluates relational querying, complex JOINs, window functions, indexing, and ACID transactions.",
    durationMinutes: 20,
    totalQuestions: 8,
    benchmarkScore: 80,
    questions: [
      {
        id: "sql-1",
        question: "Which SQL clause is used to filter aggregated group results?",
        options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Aggregation",
        explanation: "WHERE filters rows before grouping, while HAVING filters aggregated group results.",
      },
      {
        id: "sql-2",
        question: "What does an `INNER JOIN` return?",
        options: [
          "All records from both tables",
          "Only records that have matching values in both tables",
          "All records from the left table and matched from the right",
          "The Cartesian product of both tables"
        ],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "JOINs",
        explanation: "INNER JOIN selects records that have matching keys in both joined tables.",
      },
      {
        id: "sql-3",
        question: "Which window function assigns a rank to each row within a partition with gaps in ranking for ties?",
        options: ["ROW_NUMBER()", "RANK()", "DENSE_RANK()", "NTILE()"],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Window Functions",
        explanation: "RANK() leaves gaps in sequence when ties occur, whereas DENSE_RANK() does not.",
      },
      {
        id: "sql-4",
        question: "What is the difference between `UNION` and `UNION ALL` in SQL?",
        options: [
          "`UNION` removes duplicate rows, while `UNION ALL` retains all rows including duplicates",
          "`UNION ALL` removes duplicates, while `UNION` retains them",
          "`UNION` requires matching data types, while `UNION ALL` does not",
          "`UNION` can only combine two queries, while `UNION ALL` combines unlimited"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Set Operations",
        explanation: "`UNION` performs an internal distinct sorting operation, whereas `UNION ALL` simply concatenates result sets.",
      },
      {
        id: "sql-5",
        question: "What type of index is most effective for range queries like `WHERE created_at BETWEEN ? AND ?` in PostgreSQL?",
        options: ["Hash Index", "B-Tree Index", "GIN Index", "BRIN Index alone"],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Indexing & Query Optimization",
        explanation: "B-Tree indexes maintain sorted order, making them optimal for equality and range query comparisons.",
      },
      {
        id: "sql-6",
        question: "What does the 'I' in ACID transaction properties stand for?",
        options: ["Integrity", "Isolation", "Inheritance", "Indexing"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "ACID Properties",
        explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability.",
      },
      {
        id: "sql-7",
        question: "What is a CTE (Common Table Expression) introduced with the `WITH` clause?",
        options: [
          "A temporary named result set defined within the execution scope of a single statement",
          "A permanent physical table stored on disk",
          "A stored procedure compiled into binary",
          "A database trigger"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "CTEs",
        explanation: "CTEs specify temporary result sets that can be referenced within a SELECT, INSERT, UPDATE, or DELETE.",
      },
      {
        id: "sql-8",
        question: "In PostgreSQL, what is the default transaction isolation level?",
        options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Concurrency Control",
        explanation: "PostgreSQL defaults to Read Committed transaction isolation.",
      },
    ],
  },
  {
    id: "assess-ml",
    title: "Machine Learning & AI Assessment",
    skillName: "Machine Learning",
    category: "Technical",
    description: "Evaluates supervised/unsupervised learning, model evaluation metrics, regularization, and feature engineering.",
    durationMinutes: 20,
    totalQuestions: 8,
    benchmarkScore: 80,
    questions: [
      {
        id: "ml-1",
        question: "Which evaluation metric is best suited for an imbalanced classification problem like fraud detection?",
        options: ["Accuracy", "ROC-AUC / Precision-Recall AUC", "Mean Squared Error", "R-squared"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Evaluation Metrics",
        explanation: "Precision-Recall AUC or ROC-AUC provides a meaningful metric when the positive class is rare.",
      },
      {
        id: "ml-2",
        question: "What problem does L1 regularization (Lasso) address compared to L2 regularization (Ridge)?",
        options: [
          "It forces exact zero coefficients, producing sparse feature selection",
          "It accelerates gradient descent convergence speed",
          "It prevents underfitting in deep neural networks",
          "It removes categorical outliers"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Regularization",
        explanation: "L1 penalty (Lasso) drives uninformative feature weights to exactly 0, acting as feature selection.",
      },
      {
        id: "ml-3",
        question: "In the bias-variance tradeoff, what does high variance typically indicate?",
        options: [
          "Underfitting: the model is too simple to capture patterns",
          "Overfitting: the model fits training noise and generalizes poorly",
          "Optimal model convergence",
          "Zero training loss with perfect test validation"
        ],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Model Generalization",
        explanation: "High variance indicates the model is sensitive to training set fluctuations and overfits.",
      },
      {
        id: "ml-4",
        question: "Which algorithm combines multiple weak decision trees sequentially to minimize residual errors?",
        options: ["Random Forest", "Gradient Boosting (GBDT / XGBoost)", "K-Means", "Principal Component Analysis"],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Ensemble Methods",
        explanation: "Gradient Boosting iteratively trains subsequent trees on the pseudo-residuals of preceding models.",
      },
      {
        id: "ml-5",
        question: "What is the primary objective of Principal Component Analysis (PCA)?",
        options: [
          "Dimensionality reduction while preserving maximum data variance",
          "Clustering unlabeled data into K clusters",
          "Training convolutional neural networks",
          "Solving non-linear differential equations"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Unsupervised Learning",
        explanation: "PCA orthogonalizes features to project data onto principal eigenvectors of maximum variance.",
      },
      {
        id: "ml-6",
        question: "What is data leakage in machine learning pipelines?",
        options: [
          "Information from the target or test set inadvertently leaking into the training pipeline",
          "A memory leak in Python pandas dataframes",
          "Corrupted CSV input data",
          "Loss of gradient values during backpropagation"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "MLOps & Pipelines",
        explanation: "Data leakage happens when features contain information not available at true inference time.",
      },
      {
        id: "ml-7",
        question: "What is the purpose of the Transformer self-attention mechanism?",
        options: [
          "Computes contextual relationships between all tokens in a sequence simultaneously",
          "Replaces backpropagation with recursive filtering",
          "Reduces token dimensions to binary vectors",
          "Performs random dropout"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "Deep Learning & Transformers",
        explanation: "Self-attention computes Query-Key-Value dot products across all sequence tokens concurrently.",
      },
      {
        id: "ml-8",
        question: "How is Cross-Validation typically performed with time-series data?",
        options: [
          "Standard random K-Fold split",
          "TimeSeriesSplit / Forward Chaining (Walk-Forward validation)",
          "Stratified K-Fold with random shuffling",
          "Bootstrapping"
        ],
        correctAnswer: 1,
        difficulty: "HARD",
        topic: "Validation Strategies",
        explanation: "Time series validation requires preserving chronological order without lookahead bias.",
      },
    ],
  },
  {
    id: "assess-react",
    title: "React & Modern Frontend Assessment",
    skillName: "React",
    category: "Technical",
    description: "Evaluates component state, hooks lifecycle, memoization, TanStack Router, and performance.",
    durationMinutes: 20,
    totalQuestions: 6,
    benchmarkScore: 80,
    questions: [
      {
        id: "rc-1",
        question: "Which React hook is used to memoize expensive calculation results between renders?",
        options: ["useCallback", "useMemo", "useRef", "useEffect"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Hooks",
        explanation: "`useMemo` caches the calculated return value of a function until its dependency array changes.",
      },
      {
        id: "rc-2",
        question: "What is the main difference between `useCallback` and `useMemo`?",
        options: [
          "`useCallback` memoizes a callback function definition, while `useMemo` memoizes a computed value",
          "`useCallback` only runs on unmount",
          "`useMemo` is strictly for server rendering",
          "`useCallback` cannot take a dependency array"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Performance & Hooks",
        explanation: "`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.",
      },
      {
        id: "rc-3",
        question: "Why should `key` props in React lists be unique and stable rather than array indices?",
        options: [
          "Indices cause incorrect component identity matching during reordering or deletions",
          "React throws a fatal compilation error if indices are used",
          "Keys are used for CSS selector queries",
          "Indices increase network bundle payload size"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Reconciliation",
        explanation: "Stable keys allow React's diffing algorithm to correctly identify which list items were moved, added, or removed.",
      },
      {
        id: "rc-4",
        question: "What will happen if you update state inside a `useEffect` without specifying dependencies?",
        options: [
          "It will cause an infinite render loop",
          "It will run only once on mount",
          "React will automatically batch it into one call",
          "State will freeze permanently"
        ],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "Lifecycle & Effects",
        explanation: "Without dependencies, useEffect runs on every render, and updating state triggers another render.",
      },
      {
        id: "rc-5",
        question: "In React 19, what does the `use()` hook enable?",
        options: [
          "Reading Promises and Context directly inside components and hooks with Suspense integration",
          "Creating background web workers",
          "Binding GraphQL mutations",
          "Automating TypeScript types"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "React 19 & Suspense",
        explanation: "`use` is a React API that reads the value of a resource like a Promise or Context synchronously within render.",
      },
      {
        id: "rc-6",
        question: "What does `useRef` preserve across component re-renders?",
        options: [
          "A mutable `.current` property without triggering a re-render when mutated",
          "Immutable state synchronized with browser URL",
          "Server-side session tokens",
          "A Redux store subscription"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Refs & State",
        explanation: "useRef returns a persistent object whose `.current` property can be modified without causing re-renders.",
      },
      {
        id: "rc-7",
        question: "How does React 18+ handle automatic state batching across asynchronous callbacks like `fetch` or `setTimeout`?",
        options: [
          "Batches state updates together automatically across microtasks and macrotasks into a single re-render",
          "Requires wrapping updates in `unstable_batchedUpdates`",
          "Only batches state updates inside synthetic React event handlers",
          "Executes one immediate re-render per state setter call"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Concurrent React & Batching",
        explanation: "React 18 introduced automatic batching for all updates inside timeouts, promises, and native event handlers.",
      },
      {
        id: "rc-8",
        question: "What is a primary architectural difference between React Server Components (RSC) and Client Components?",
        options: [
          "Server Components execute solely on the server and add zero JavaScript to the client bundle",
          "Server Components cannot accept props from parent components",
          "Client Components cannot make asynchronous network requests",
          "Server Components require hydration on the client"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "Server Components & Bundling",
        explanation: "RSC render exclusively on the server, streaming JSON representation to the client without sending component code to the client bundle.",
      },
      {
        id: "rc-9",
        question: "Which lifecycle method or class method is required to catch JavaScript errors anywhere in a child component tree?",
        options: [
          "`static getDerivedStateFromError()` or `componentDidCatch()`",
          "`useEffect(() => {}, [])` with try/catch",
          "`window.onerror` in root index.html",
          "`useErrorBoundary` built-in hook"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Error Boundaries",
        explanation: "Error boundaries are class components defining `static getDerivedStateFromError()` or `componentDidCatch()`.",
      },
      {
        id: "rc-10",
        question: "Which hook should be used by external state stores to subscribe to data without tearing under concurrent rendering?",
        options: ["useSyncExternalStore", "useLayoutEffect", "useDeferredValue", "useInsertionEffect"],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "Store Subscriptions",
        explanation: "`useSyncExternalStore` is specifically designed for library authors to subscribe to external stores synchronously.",
      },
    ],
  },
  {
    id: "assess-aws",
    title: "AWS & Cloud Infrastructure Assessment",
    skillName: "AWS",
    category: "Technical",
    description: "Evaluates cloud compute, serverless architectures, S3, IAM security, and networking fundamentals.",
    durationMinutes: 20,
    totalQuestions: 10,
    benchmarkScore: 75,
    questions: [
      {
        id: "aws-1",
        question: "Which AWS service provides serverless event-driven compute execution without provisioning servers?",
        options: ["Amazon EC2", "AWS Lambda", "Amazon ECS", "AWS Elastic Beanstalk"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Serverless Compute",
        explanation: "AWS Lambda executes code in response to triggers and automatically manages compute capacity.",
      },
      {
        id: "aws-2",
        question: "What is the recommended best practice for granting minimal required permissions in AWS IAM?",
        options: [
          "Principle of Least Privilege",
          "Assigning AdministratorAccess to all developers",
          "Sharing root credentials",
          "Disabling MFA for automated scripts"
        ],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "IAM & Security",
        explanation: "The Principle of Least Privilege dictates granting only the exact permissions needed to perform a task.",
      },
      {
        id: "aws-3",
        question: "What is an Amazon CloudFront distribution used for?",
        options: [
          "Global Content Delivery Network (CDN) to reduce latency by caching data near edge locations",
          "Relational database hosting",
          "Continuous integration pipeline orchestration",
          "Machine learning model training"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Networking & Edge",
        explanation: "Amazon CloudFront delivers content, videos, applications, and APIs globally with low latency via edge servers.",
      },
      {
        id: "aws-4",
        question: "Which storage class in Amazon S3 is most cost-effective for long-term data archiving with retrieval times of several hours?",
        options: ["S3 Standard", "S3 Glacier Flexible Archive / Deep Archive", "S3 One Zone-IA", "S3 Intelligent-Tiering"],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Storage",
        explanation: "S3 Glacier Deep Archive is Amazon S3’s lowest-cost storage class for long-term data retention.",
      },
      {
        id: "aws-5",
        question: "What is a VPC (Virtual Private Cloud) Security Group?",
        options: [
          "A virtual stateful firewall that controls inbound and outbound traffic for an instance",
          "A stateless subnet-level packet filter",
          "An encryption key manager",
          "An IAM role for EC2 instances"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "VPC & Networking",
        explanation: "Security groups are stateful virtual firewalls operating at the instance level.",
      },
      {
        id: "aws-6",
        question: "What is the primary benefit of deploying applications across multiple AWS Availability Zones (Multi-AZ)?",
        options: [
          "High availability and fault tolerance against single data center outages",
          "Reduced cloud storage billing rates",
          "Zero-latency compute execution",
          "Automatic code compilation"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Architecture & Reliability",
        explanation: "Multi-AZ deployment ensures workloads remain accessible if one data center zone experiences an outage.",
      },
      {
        id: "aws-7",
        question: "What is the key architectural difference between Amazon SNS and Amazon SQS?",
        options: [
          "Amazon SNS is a pub/sub fanout messaging service, while Amazon SQS is a distributed message queue for decoupling worker processing",
          "Amazon SQS sends push notifications to mobile devices, while SNS stores database records",
          "SNS is strictly synchronous, whereas SQS is strictly asynchronous",
          "SQS cannot guarantee message delivery order even with FIFO"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Messaging & Decoupling",
        explanation: "SNS distributes one message to many subscriber endpoints (fanout), while SQS holds messages until consumer workers poll and process them.",
      },
      {
        id: "aws-8",
        question: "In Amazon DynamoDB, how is primary key partitioning structured for optimal high-throughput scaling?",
        options: [
          "Using a Partition Key (hash key) with high cardinality to distribute data evenly across physical storage partitions",
          "Storing all records under a single static partition key",
          "Disabling sort keys entirely",
          "Querying via global full-table scans"
        ],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "NoSQL Database Design",
        explanation: "High cardinality partition keys evenly distribute read/write requests across DynamoDB's internal physical partitions, preventing hot spots.",
      },
      {
        id: "aws-9",
        question: "What AWS service allows defining and provisioning cloud infrastructure using code files (IaC) in JSON or YAML?",
        options: ["AWS CloudFormation", "AWS CodeCommit", "Amazon Cognito", "AWS Trusted Advisor"],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "Infrastructure as Code",
        explanation: "AWS CloudFormation allows modeling infrastructure declaratively in YAML/JSON templates.",
      },
      {
        id: "aws-10",
        question: "How does an Application Load Balancer (ALB) route HTTP traffic dynamically to microservices?",
        options: [
          "Path-based and host-based routing rules directing requests to specific target groups",
          "DNS round-robin only",
          "Hardware MAC address inspection",
          "Static IP port remapping without health checks"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Load Balancing",
        explanation: "ALBs operate at Layer 7 (HTTP/HTTPS) and route traffic based on URL path, host header, HTTP method, or query parameters.",
      },
    ],
  },
  {
    id: "assess-aptitude",
    title: "Quantitative Aptitude & Problem Solving",
    skillName: "Aptitude",
    category: "Aptitude",
    description: "Evaluates numerical reasoning, percentages, time & work, probability, and analytical speed.",
    durationMinutes: 15,
    totalQuestions: 5,
    benchmarkScore: 75,
    questions: [
      {
        id: "apt-1",
        question: "If A can complete a task in 10 days and B in 15 days, how many days will they take working together?",
        options: ["5 days", "6 days", "8 days", "12 days"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Time & Work",
        explanation: "1/10 + 1/15 = 5/30 = 1/6. Total time = 6 days.",
      },
      {
        id: "apt-2",
        question: "A product is priced at $100. It is increased by 20%, then discounted by 20%. What is the final price?",
        options: ["$100", "$96", "$98", "$104"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Percentages",
        explanation: "100 * 1.20 = 120. 120 * 0.80 = $96.",
      },
      {
        id: "apt-3",
        question: "Two fair 6-sided dice are rolled. What is the probability that the sum of the dice equals 7?",
        options: ["1/6", "1/12", "7/36", "5/36"],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Probability",
        explanation: "Favorable pairs: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6/36 = 1/6.",
      },
      {
        id: "apt-4",
        question: "A train 240 meters long passes a pole in 24 seconds. What is the speed of the train in km/h?",
        options: ["36 km/h", "40 km/h", "30 km/h", "48 km/h"],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Speed, Distance, Time",
        explanation: "Speed = 240m / 24s = 10 m/s = 10 * (18/5) = 36 km/h.",
      },
      {
        id: "apt-5",
        question: "If the ratio of ages of A and B is 3:4, and the sum of their ages is 42, what will be their ratio in 6 years?",
        options: ["4:5", "7:9", "5:6", "3:5"],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "Ratios & Proportions",
        explanation: "7 units = 42 -> 1 unit = 6. A=18, B=24. In 6 yrs: A=24, B=30 -> 24:30 = 4:5.",
      },
    ],
  },
  {
    id: "assess-reasoning",
    title: "Logical & Analytical Reasoning",
    skillName: "Logical Reasoning",
    category: "Aptitude",
    description: "Evaluates pattern recognition, deductive logic, syllogisms, and sequence inference.",
    durationMinutes: 15,
    totalQuestions: 5,
    benchmarkScore: 75,
    questions: [
      {
        id: "log-1",
        question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "38"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Number Series",
        explanation: "Differences are +4, +6, +8, +10. Next difference is +12: 30 + 12 = 42 (also n^2 + n).",
      },
      {
        id: "log-2",
        question: "Statements: All roses are flowers. Some flowers fade quickly. Conclusion: Some roses fade quickly.",
        options: [
          "Conclusion follows logically",
          "Conclusion does not necessarily follow",
          "Both statements are invalid",
          "None of the above"
        ],
        correctAnswer: 1,
        difficulty: "MEDIUM",
        topic: "Syllogisms",
        explanation: "The flowers that fade quickly may not include roses, so the conclusion is not guaranteed.",
      },
      {
        id: "log-3",
        question: "Pointing to a photograph, a woman says: 'He is the son of the only daughter of my father.' Who is the man in the photo to her?",
        options: ["Brother", "Son", "Nephew", "Uncle"],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Blood Relations",
        explanation: "The only daughter of her father is herself. The man is her son.",
      },
      {
        id: "log-4",
        question: "If CLOCK is coded as KCOLC, how is BRIDGE coded in the same scheme?",
        options: ["EGDIRB", "GEDIRB", "EGDBRI", "BGERID"],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "Coding & Decoding",
        explanation: "The word is simply spelled in reverse order.",
      },
      {
        id: "log-5",
        question: "In a code language: '123' means 'hot filtered coffee', '356' means 'very hot day', '589' means 'day and night'. Which digit represents 'very'?",
        options: ["6", "3", "5", "8"],
        correctAnswer: 0,
        difficulty: "HARD",
        topic: "Deductive Coding",
        explanation: "'hot' is common to 123 & 356 -> 'hot' = 3. 'day' is common to 356 & 589 -> 'day' = 5. Therefore in '356', 'very' = 6.",
      },
    ],
  },
  {
    id: "assess-communication",
    title: "Professional Communication & Workplace Soft Skills",
    skillName: "Soft Skills",
    category: "Soft Skills",
    description: "Evaluates workplace communication etiquette, active listening, conflict resolution, and cross-functional leadership.",
    durationMinutes: 15,
    totalQuestions: 5,
    benchmarkScore: 80,
    questions: [
      {
        id: "comm-1",
        question: "When sending an urgent technical escalation email to leadership, what is the best subject line format?",
        options: [
          "[ACTION REQUIRED] [P1 Outage] Payment Gateway Failure — Incident Summary & ETA",
          "Urgent please check now!!",
          "Bug in system",
          "Fwd: Problem"
        ],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "Email Etiquette",
        explanation: "Clear, categorized tags with specific impact and severity level enable immediate triaging.",
      },
      {
        id: "comm-2",
        question: "During a sprint retro, a teammate disagrees with your architectural proposal. What is the most constructive response?",
        options: [
          "Dismiss their feedback and proceed with your original choice",
          "Ask clarifying questions to understand their specific trade-off concerns and compare data points",
          "Escalate to engineering management immediately",
          "Remain silent and ignore future meetings"
        ],
        correctAnswer: 1,
        difficulty: "EASY",
        topic: "Conflict Resolution",
        explanation: "Active listening and evidence-based comparison foster productive cross-functional alignment.",
      },
      {
        id: "comm-3",
        question: "What does the STAR method stand for in behavioral interviews?",
        options: [
          "Situation, Task, Action, Result",
          "Strategy, Theory, Analysis, Review",
          "System, Technology, Architecture, Reliability",
          "Scope, Timeline, Agility, Release"
        ],
        correctAnswer: 0,
        difficulty: "EASY",
        topic: "Interview Excellence",
        explanation: "STAR (Situation, Task, Action, Result) is the gold standard framework for answering behavioral questions.",
      },
      {
        id: "comm-4",
        question: "How should an engineer communicate a missed project deadline to stakeholders?",
        options: [
          "Notify stakeholders proactively as soon as delay is anticipated, explaining root causes and a revised recovery plan",
          "Wait until the deadline date passes before sending an email",
          "Blame other dependencies or third-party APIs",
          "Silently push changes over the weekend without telling anyone"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Stakeholder Management",
        explanation: "Proactive, transparent communication with recovery milestones builds trust and accountability.",
      },
      {
        id: "comm-5",
        question: "What is the primary objective of an asynchronous code review comment?",
        options: [
          "To provide actionable, constructive feedback on correctness, maintainability, and security with clear reasoning",
          "To point out stylistic preferences without explanations",
          "To reject the PR as quickly as possible",
          "To approve without reviewing"
        ],
        correctAnswer: 0,
        difficulty: "MEDIUM",
        topic: "Code Review Culture",
        explanation: "Effective reviews offer clear rationale, reference documentation, and focus on code quality.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Phase 4B — Coding & SQL Assessment Types
// ---------------------------------------------------------------------------

export interface CodingQuestionDef {
  id: string;
  question: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  explanation: string;
  starterCode: string;
  solutionCode: string;
  functionSignature: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    explanation?: string;
    points?: number;
  }>;
}

export interface SqlQuestionDef {
  id: string;
  question: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  explanation: string;
  dbSchema: string;
  initialDbData: string;
  solutionCode: string;
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
}

export interface CodingAssessmentDef {
  id: string;
  title: string;
  skillName: string;
  category: "Technical";
  type: "CODING";
  language: "python";
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  benchmarkScore: number;
  questions: CodingQuestionDef[];
}

export interface SqlAssessmentDef {
  id: string;
  title: string;
  skillName: string;
  category: "Technical";
  type: "SQL";
  language: "sql";
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  benchmarkScore: number;
  questions: SqlQuestionDef[];
}

// ---------------------------------------------------------------------------
// Shared SQL Schema & Fixture Data (used across all SQL questions)
// ---------------------------------------------------------------------------

const SQL_SHARED_SCHEMA = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary REAL NOT NULL,
  hire_date TEXT NOT NULL,
  manager_id INTEGER
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT,
  status TEXT DEFAULT 'active'
);
`;

const SQL_SHARED_DATA = `
INSERT INTO departments VALUES (1, 'Engineering', 1200000, 'San Francisco');
INSERT INTO departments VALUES (2, 'Marketing', 450000, 'New York');
INSERT INTO departments VALUES (3, 'Data Science', 800000, 'San Francisco');
INSERT INTO departments VALUES (4, 'Sales', 350000, 'Chicago');

INSERT INTO employees VALUES (1, 'Alice Chen', 'Engineering', 125000, '2021-03-15', NULL);
INSERT INTO employees VALUES (2, 'Bob Kumar', 'Engineering', 115000, '2021-06-01', 1);
INSERT INTO employees VALUES (3, 'Carol Davis', 'Marketing', 95000, '2020-01-10', NULL);
INSERT INTO employees VALUES (4, 'David Wilson', 'Data Science', 130000, '2020-08-20', NULL);
INSERT INTO employees VALUES (5, 'Eve Martinez', 'Engineering', 105000, '2022-01-05', 1);
INSERT INTO employees VALUES (6, 'Frank Lee', 'Data Science', 120000, '2021-09-12', 4);
INSERT INTO employees VALUES (7, 'Grace Park', 'Marketing', 88000, '2022-03-20', 3);
INSERT INTO employees VALUES (8, 'Hiro Tanaka', 'Sales', 92000, '2021-11-01', NULL);
INSERT INTO employees VALUES (9, 'Ivy Johnson', 'Engineering', 140000, '2019-05-15', NULL);
INSERT INTO employees VALUES (10, 'Jake Brown', 'Sales', 85000, '2022-07-10', 8);
INSERT INTO employees VALUES (11, 'Karen White', 'Data Science', 110000, '2022-02-28', 4);
INSERT INTO employees VALUES (12, 'Leo Garcia', 'Engineering', 98000, '2023-01-15', 1);

INSERT INTO projects VALUES (1, 'Cloud Migration', 1, '2023-01-01', '2023-06-30', 'completed');
INSERT INTO projects VALUES (2, 'Brand Redesign', 2, '2023-03-01', NULL, 'active');
INSERT INTO projects VALUES (3, 'ML Pipeline', 3, '2023-02-15', NULL, 'active');
INSERT INTO projects VALUES (4, 'Sales Dashboard', 4, '2023-04-01', '2023-09-30', 'completed');
INSERT INTO projects VALUES (5, 'API Gateway', 1, '2023-06-01', NULL, 'active');
INSERT INTO projects VALUES (6, 'Customer Analytics', 3, '2023-07-01', NULL, 'active');
`;

// ---------------------------------------------------------------------------
// Coding Assessments Catalog
// ---------------------------------------------------------------------------

export const CODING_ASSESSMENTS_CATALOG: CodingAssessmentDef[] = [
  {
    id: "assess-python-coding",
    title: "Python Coding Challenge",
    skillName: "Python",
    category: "Technical",
    type: "CODING",
    language: "python",
    description:
      "Solve 5 Python coding problems covering arrays, strings, data structures, and data processing. Write real code that passes all test cases.",
    durationMinutes: 45,
    totalQuestions: 5,
    benchmarkScore: 60,
    questions: [
      {
        id: "code-py-1",
        question:
          "**Two Sum**\n\nGiven a list of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as a list of two indices (0-based), in any order.",
        difficulty: "EASY",
        topic: "Arrays & Hash Maps",
        explanation:
          "Use a hash map to store each number's index. For each number, check if (target - number) exists in the map.",
        functionSignature: "def two_sum(nums: list[int], target: int) -> list[int]:",
        starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass`,
        solutionCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
        constraints: "2 <= len(nums) <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.",
        sampleInput: '{"function": "two_sum", "args": [[2, 7, 11, 15], 9]}',
        sampleOutput: "[0, 1]",
        testCases: [
          {
            input: '{"function": "two_sum", "args": [[2, 7, 11, 15], 9]}',
            expectedOutput: "[0, 1]",
            isHidden: false,
            explanation: "nums[0] + nums[1] = 2 + 7 = 9",
            points: 20,
          },
          {
            input: '{"function": "two_sum", "args": [[3, 2, 4], 6]}',
            expectedOutput: "[1, 2]",
            isHidden: false,
            explanation: "nums[1] + nums[2] = 2 + 4 = 6",
            points: 20,
          },
          {
            input: '{"function": "two_sum", "args": [[3, 3], 6]}',
            expectedOutput: "[0, 1]",
            isHidden: false,
            explanation: "nums[0] + nums[1] = 3 + 3 = 6",
            points: 20,
          },
          {
            input: '{"function": "two_sum", "args": [[1, 5, 3, 7, 2, 8], 10]}',
            expectedOutput: "[2, 3]",
            isHidden: true,
            explanation: "3 + 7 = 10 at indices [2, 3]",
            points: 20,
          },
          {
            input: '{"function": "two_sum", "args": [[-1, -2, -3, -4, -5], -8]}',
            expectedOutput: "[2, 4]",
            isHidden: true,
            explanation: "-3 + -5 = -8",
            points: 20,
          },
        ],
      },
      {
        id: "code-py-2",
        question:
          "**Valid Parentheses**\n\nGiven a string `s` containing just the characters `(`, `)`, `{`, `}`, `[`, and `]`, determine if the input string is valid.\n\nA string is valid if:\n1. Open brackets are closed by the same type of brackets.\n2. Open brackets are closed in the correct order.\n3. Every close bracket has a corresponding open bracket.",
        difficulty: "EASY",
        topic: "Stacks & Strings",
        explanation:
          "Use a stack. Push opening brackets, pop on closing brackets and verify the match.",
        functionSignature: "def is_valid(s: str) -> bool:",
        starterCode: `def is_valid(s: str) -> bool:
    # Your code here
    pass`,
        solutionCode: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return len(stack) == 0`,
        constraints: "1 <= len(s) <= 10^4\ns consists of parentheses only: ()[]{}",
        sampleInput: '{"function": "is_valid", "args": ["()"]}',
        sampleOutput: "true",
        testCases: [
          {
            input: '{"function": "is_valid", "args": ["()"]}',
            expectedOutput: "true",
            isHidden: false,
            explanation: "Simple matching pair.",
            points: 20,
          },
          {
            input: '{"function": "is_valid", "args": ["()[]{}"]}',
            expectedOutput: "true",
            isHidden: false,
            explanation: "Three matching pairs.",
            points: 20,
          },
          {
            input: '{"function": "is_valid", "args": ["(]"]}',
            expectedOutput: "false",
            isHidden: false,
            explanation: "Mismatched types.",
            points: 20,
          },
          {
            input: '{"function": "is_valid", "args": ["{[()]}"]}',
            expectedOutput: "true",
            isHidden: true,
            explanation: "Nested brackets.",
            points: 20,
          },
          {
            input: '{"function": "is_valid", "args": ["((("]}',
            expectedOutput: "false",
            isHidden: true,
            explanation: "Unclosed brackets.",
            points: 20,
          },
        ],
      },
      {
        id: "code-py-3",
        question:
          "**Frequency Counter**\n\nGiven a list of strings `words`, return a dictionary mapping each string to the number of times it appears.\n\nSort by frequency descending. If tied, sort alphabetically.",
        difficulty: "MEDIUM",
        topic: "Hash Maps & Sorting",
        explanation:
          "Use a Counter or dict to count, sort by (-count, word).",
        functionSignature: "def frequency_count(words: list[str]) -> dict:",
        starterCode: `def frequency_count(words: list[str]) -> dict:
    # Your code here
    pass`,
        solutionCode: `def frequency_count(words: list[str]) -> dict:
    freq = {}
    for word in words:
        freq[word] = freq.get(word, 0) + 1
    sorted_items = sorted(freq.items(), key=lambda x: (-x[1], x[0]))
    return dict(sorted_items)`,
        constraints: "1 <= len(words) <= 10^4\nwords[i] consists of lowercase English letters.",
        sampleInput: '{"function": "frequency_count", "args": [["apple", "banana", "apple", "cherry", "banana", "apple"]]}',
        sampleOutput: '{"apple": 3, "banana": 2, "cherry": 1}',
        testCases: [
          {
            input: '{"function": "frequency_count", "args": [["apple", "banana", "apple", "cherry", "banana", "apple"]]}',
            expectedOutput: '{"apple": 3, "banana": 2, "cherry": 1}',
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "frequency_count", "args": [["a", "b", "c", "a", "b", "a"]]}',
            expectedOutput: '{"a": 3, "b": 2, "c": 1}',
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "frequency_count", "args": [["x", "y", "x", "y"]]}',
            expectedOutput: '{"x": 2, "y": 2}',
            isHidden: true,
            explanation: "Same frequency — alphabetical tiebreak.",
            points: 20,
          },
          {
            input: '{"function": "frequency_count", "args": [["hello"]]}',
            expectedOutput: '{"hello": 1}',
            isHidden: true,
            points: 20,
          },
          {
            input: '{"function": "frequency_count", "args": [["cat", "dog", "cat", "bird", "dog", "cat", "bird", "bird"]]}',
            expectedOutput: '{"bird": 3, "cat": 3, "dog": 2}',
            isHidden: true,
            explanation: "bird=3, cat=3 (alphabetical tie), dog=2",
            points: 20,
          },
        ],
      },
      {
        id: "code-py-4",
        question:
          "**Array Deduplication**\n\nGiven a sorted integer array `nums`, remove duplicates in-place so each element appears only once. Return the new length.\n\nDo not allocate extra space — modify the input array in-place with O(1) extra memory.",
        difficulty: "MEDIUM",
        topic: "Two Pointers",
        explanation: "Use slow/fast pointers. Advance slow only when a new unique value is found.",
        functionSignature: "def remove_duplicates(nums: list[int]) -> int:",
        starterCode: `def remove_duplicates(nums: list[int]) -> int:
    # Your code here
    pass`,
        solutionCode: `def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1`,
        constraints: "1 <= len(nums) <= 3 * 10^4\nnums is sorted in non-decreasing order.",
        sampleInput: '{"function": "remove_duplicates", "args": [[1, 1, 2]]}',
        sampleOutput: "2",
        testCases: [
          {
            input: '{"function": "remove_duplicates", "args": [[1, 1, 2]]}',
            expectedOutput: "2",
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "remove_duplicates", "args": [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]]}',
            expectedOutput: "5",
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "remove_duplicates", "args": [[1]]}',
            expectedOutput: "1",
            isHidden: true,
            points: 20,
          },
          {
            input: '{"function": "remove_duplicates", "args": [[1, 2, 3, 4, 5]]}',
            expectedOutput: "5",
            isHidden: true,
            points: 20,
          },
          {
            input: '{"function": "remove_duplicates", "args": [[-3, -3, -1, -1, 0, 0, 0, 2, 2]]}',
            expectedOutput: "4",
            isHidden: true,
            points: 20,
          },
        ],
      },
      {
        id: "code-py-5",
        question:
          "**Top Students**\n\nGiven a list of dicts with `'name'` and `'score'` keys, return the names of the top `n` students by score descending. Ties broken alphabetically.",
        difficulty: "HARD",
        topic: "Sorting & Data Processing",
        explanation: "Sort by (-score, name), then slice first n names.",
        functionSignature: "def top_students(students: list[dict], n: int) -> list[str]:",
        starterCode: `def top_students(students: list[dict], n: int) -> list[str]:
    # Your code here
    pass`,
        solutionCode: `def top_students(students: list[dict], n: int) -> list[str]:
    sorted_s = sorted(students, key=lambda s: (-s['score'], s['name']))
    return [s['name'] for s in sorted_s[:n]]`,
        constraints: "1 <= len(students) <= 10^4\n1 <= n <= len(students)",
        sampleInput: '{"function": "top_students", "args": [[{"name": "Alice", "score": 92}, {"name": "Bob", "score": 85}, {"name": "Carol", "score": 95}], 2]}',
        sampleOutput: '["Carol", "Alice"]',
        testCases: [
          {
            input: '{"function": "top_students", "args": [[{"name": "Alice", "score": 92}, {"name": "Bob", "score": 85}, {"name": "Carol", "score": 95}], 2]}',
            expectedOutput: '["Carol", "Alice"]',
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "top_students", "args": [[{"name": "Zoe", "score": 88}, {"name": "Amy", "score": 88}, {"name": "Max", "score": 90}], 3]}',
            expectedOutput: '["Max", "Amy", "Zoe"]',
            isHidden: false,
            points: 20,
          },
          {
            input: '{"function": "top_students", "args": [[{"name": "A", "score": 100}], 1]}',
            expectedOutput: '["A"]',
            isHidden: true,
            points: 20,
          },
          {
            input: '{"function": "top_students", "args": [[{"name": "D", "score": 70}, {"name": "C", "score": 80}, {"name": "B", "score": 90}, {"name": "A", "score": 100}], 2]}',
            expectedOutput: '["A", "B"]',
            isHidden: true,
            points: 20,
          },
          {
            input: '{"function": "top_students", "args": [[{"name": "Eve", "score": 75}, {"name": "Dan", "score": 75}, {"name": "Fay", "score": 75}, {"name": "Cal", "score": 75}], 3]}',
            expectedOutput: '["Cal", "Dan", "Eve"]',
            isHidden: true,
            points: 20,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// SQL Assessments Catalog
// ---------------------------------------------------------------------------

export const SQL_ASSESSMENTS_CATALOG: SqlAssessmentDef[] = [
  {
    id: "assess-sql-fundamentals",
    title: "SQL Query Challenge",
    skillName: "SQL",
    category: "Technical",
    type: "SQL",
    language: "sql",
    description:
      "Solve 5 SQL problems covering aggregation, JOINs, subqueries, window functions, and CTEs against a realistic employee database.",
    durationMinutes: 40,
    totalQuestions: 5,
    benchmarkScore: 60,
    questions: [
      {
        id: "sql-1",
        question:
          "**Average Salary by Department**\n\nWrite a SQL query to find the average salary for each department.\n\nReturn columns: `department`, `avg_salary` (rounded to nearest integer).\n\nOrder by `avg_salary` descending.",
        difficulty: "EASY",
        topic: "Aggregation",
        explanation: "Use GROUP BY with AVG() and ROUND(). ORDER BY average descending.",
        dbSchema: SQL_SHARED_SCHEMA,
        initialDbData: SQL_SHARED_DATA,
        solutionCode: "SELECT department, ROUND(AVG(salary)) as avg_salary FROM employees GROUP BY department ORDER BY avg_salary DESC",
        sampleInput: "employees table with 12 rows across 4 departments",
        sampleOutput: "department | avg_salary\nData Science | 120000\nEngineering | 116600\n...",
        constraints: "Only SELECT statements allowed.",
      },
      {
        id: "sql-2",
        question:
          "**Employees in High-Budget Departments**\n\nList all employees with their department name and location, only for departments with budget > 500,000.\n\nReturn: `employee_name`, `department_name`, `location`, `salary`.\n\nOrder by salary descending.",
        difficulty: "EASY",
        topic: "JOINs",
        explanation: "JOIN employees with departments, filter WHERE budget > 500000.",
        dbSchema: SQL_SHARED_SCHEMA,
        initialDbData: SQL_SHARED_DATA,
        solutionCode: "SELECT e.name as employee_name, d.name as department_name, d.location, e.salary FROM employees e JOIN departments d ON e.department = d.name WHERE d.budget > 500000 ORDER BY e.salary DESC",
        sampleInput: "employees + departments tables",
        sampleOutput: "employee_name | department_name | location | salary\nIvy Johnson | Engineering | San Francisco | 140000\n...",
        constraints: "Only SELECT statements allowed.",
      },
      {
        id: "sql-3",
        question:
          "**Above-Average Earners**\n\nFind employees who earn more than the average salary of their own department.\n\nReturn: `name`, `department`, `salary`, `dept_avg_salary` (rounded).\n\nOrder by department ASC, salary DESC.",
        difficulty: "MEDIUM",
        topic: "Subqueries",
        explanation: "Use a subquery or CTE to compute per-department averages, then filter.",
        dbSchema: SQL_SHARED_SCHEMA,
        initialDbData: SQL_SHARED_DATA,
        solutionCode: "SELECT e.name, e.department, e.salary, ROUND(dept.avg_sal) as dept_avg_salary FROM employees e JOIN (SELECT department, AVG(salary) as avg_sal FROM employees GROUP BY department) dept ON e.department = dept.department WHERE e.salary > dept.avg_sal ORDER BY e.department ASC, e.salary DESC",
        sampleInput: "employees table with per-department salary averages",
        sampleOutput: "name | department | salary | dept_avg_salary\nDavid Wilson | Data Science | 130000 | 120000\n...",
        constraints: "Only SELECT statements allowed.",
      },
      {
        id: "sql-4",
        question:
          "**Department Summary Report**\n\nShow a summary for each department: name, employee count, active project count, and budget.\n\nReturn: `department_name`, `employee_count`, `active_projects`, `budget`.\n\nOrder by `employee_count` DESC.",
        difficulty: "MEDIUM",
        topic: "Complex JOINs & Aggregation",
        explanation: "Use LEFT JOINs with COUNT(DISTINCT) to avoid duplicates across multiple joins.",
        dbSchema: SQL_SHARED_SCHEMA,
        initialDbData: SQL_SHARED_DATA,
        solutionCode: "SELECT d.name as department_name, COUNT(DISTINCT e.id) as employee_count, COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects, d.budget FROM departments d LEFT JOIN employees e ON e.department = d.name LEFT JOIN projects p ON p.department_id = d.id ORDER BY employee_count DESC",
        sampleInput: "departments + employees + projects tables",
        sampleOutput: "department_name | employee_count | active_projects | budget\nEngineering | 5 | 1 | 1200000\n...",
        constraints: "Only SELECT statements allowed.",
      },
      {
        id: "sql-5",
        question:
          "**Top Earners per Department**\n\nFind the top 2 highest-paid employees in each department.\n\nReturn: `department`, `name`, `salary`, `salary_rank`.\n\nUse window functions (ROW_NUMBER, RANK, or DENSE_RANK).\n\nOrder by department ASC, salary_rank ASC.",
        difficulty: "HARD",
        topic: "Window Functions",
        explanation: "Use ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC), filter rank <= 2.",
        dbSchema: SQL_SHARED_SCHEMA,
        initialDbData: SQL_SHARED_DATA,
        solutionCode: "SELECT department, name, salary, salary_rank FROM (SELECT department, name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank FROM employees) ranked WHERE salary_rank <= 2 ORDER BY department ASC, salary_rank ASC",
        sampleInput: "employees table",
        sampleOutput: "department | name | salary | salary_rank\nData Science | David Wilson | 130000 | 1\n...",
        constraints: "Only SELECT statements allowed. Window functions required.",
      },
    ],
  },
];

export const LEARNING_CATALOG = [
  {
    id: "learn-tf",
    title: "TensorFlow & Keras Deep Learning Fundamentals",
    provider: "SkillBridge AI Academy",
    skill: "TensorFlow",
    difficulty: "Beginner → Intermediate",
    duration: "6 weeks",
    type: "Interactive Course",
    description: "Build neural network architectures, train custom CNNs, and deploy classification models with TensorFlow.",
    url: "https://www.tensorflow.org/tutorials",
  },
  {
    id: "learn-aws",
    title: "AWS Cloud Practitioner & Serverless Architecture",
    provider: "AWS Academy Partner",
    skill: "AWS",
    difficulty: "Beginner → Intermediate",
    duration: "4 weeks",
    type: "Hands-on Lab",
    description: "Master EC2, S3, AWS Lambda serverless functions, IAM policies, and cloud infrastructure best practices.",
    url: "https://aws.amazon.com/training/",
  },
  {
    id: "learn-mlops",
    title: "MLOps: Production ML Engineering & CI/CD Pipelines",
    provider: "HyperScale AI Labs",
    skill: "MLOps",
    difficulty: "Intermediate → Advanced",
    duration: "5 weeks",
    type: "Project-based",
    description: "Learn model tracking with MLflow, data versioning with DVC, automated testing, and Docker container deployment.",
    url: "https://mlops.community/",
  },
  {
    id: "learn-pytorch",
    title: "PyTorch for Deep Learning & Transformers",
    provider: "Deep Learning Collective",
    skill: "PyTorch",
    difficulty: "Intermediate",
    duration: "6 weeks",
    type: "Interactive Course",
    description: "Build deep learning models, fine-tune HuggingFace Transformer models, and implement custom attention layers.",
    url: "https://pytorch.org/tutorials/",
  },
  {
    id: "learn-postgres",
    title: "PostgreSQL Advanced Indexing & Query Tuning",
    provider: "Database Engineering Guild",
    skill: "PostgreSQL",
    difficulty: "Intermediate → Advanced",
    duration: "3 weeks",
    type: "Masterclass",
    description: "Master execution plans (EXPLAIN ANALYZE), multi-column B-Tree indexes, partitioning, and concurrency locking.",
    url: "https://www.postgresql.org/docs/",
  },
  {
    id: "learn-fastapi",
    title: "Production REST APIs with FastAPI & Pydantic",
    provider: "SkillBridge Backend Labs",
    skill: "FastAPI",
    difficulty: "Beginner → Intermediate",
    duration: "4 weeks",
    type: "Interactive Course",
    description: "Design high-throughput async RESTful microservices with automated OpenAPI documentation and validation.",
    url: "https://fastapi.tiangolo.com/",
  },
  {
    id: "learn-docker",
    title: "Docker & Containerization for Developers",
    provider: "DevOps Academy",
    skill: "Docker",
    difficulty: "Beginner",
    duration: "3 weeks",
    type: "Hands-on Lab",
    description: "Write production Dockerfiles, manage multi-container apps with Docker Compose, and isolate microservices.",
    url: "https://docs.docker.com/get-started/",
  },
];

export const INDUSTRY_PROGRAMS = [
  {
    id: "prog-google",
    company: "Google",
    title: "AI & Machine Learning Foundations Program",
    duration: "6 Weeks",
    certificate: true,
    description: "Industry-curated cohort on modern generative AI, neural architectures, and responsible AI practices.",
    skills: ["Machine Learning", "TensorFlow", "Python", "Deep Learning"],
    eligibility: "Students & Pre-final Year",
    url: "https://grow.google/certificates/",
  },
  {
    id: "prog-msft",
    company: "Microsoft",
    title: "Azure AI & Cloud Engineer Bootcamp",
    duration: "4 Weeks",
    certificate: true,
    description: "Comprehensive cloud development training with certified Azure fundamentals and hands-on workshops.",
    skills: ["AWS", "Cloud Architecture", "Python", "Docker"],
    eligibility: "Engineering Students",
    url: "https://learn.microsoft.com/",
  },
  {
    id: "prog-tcs",
    company: "TCS iON",
    title: "Industry Ready Full-Stack & Python Accelerator",
    duration: "8 Weeks",
    certificate: true,
    description: "Direct industry immersion program designed to prepare engineering students for enterprise campus placements.",
    skills: ["Python", "SQL", "React", "REST APIs"],
    eligibility: "All SkillBridge Registered Students",
    url: "https://www.tcsion.com/",
  },
  {
    id: "prog-amazon",
    company: "Amazon AWS",
    title: "Cloud Infrastructure & Distributed Systems Guild",
    duration: "5 Weeks",
    certificate: true,
    description: "Learn distributed backend architectures, microservices scalability, and operational reliability at scale.",
    skills: ["AWS", "Docker", "SQL", "FastAPI"],
    eligibility: "CS / IT Cohorts",
    url: "https://aws.amazon.com/training/",
  },
];
