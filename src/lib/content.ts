export const site = {
  name: "Jeanne Dominique Paloma",
  shortName: "JD Paloma",
  role: "Full-stack developer with a strong focus on UI and UX.",
  tagline: "I design and ship interfaces that feel as solid as the systems behind them.",
  email: "jeanne.d.paloma@gmail.com",
  phone: "+63 956 431 9029",
  resume:
    "https://docs.google.com/document/d/181qjv-IQ8JQicJDKkWeCNEGHVsRlAvaH/edit?usp=sharing&ouid=108500915794778499301&rtpof=true&sd=true",
  links: {
    github: "https://github.com/Jiin-dom",
    linkedin: "https://www.linkedin.com/in/jeanne-dominique-paloma-614a22250/",
    facebook: "https://www.facebook.com/jeannedominique.paloma/",
    youtube: "https://youtu.be/UQc6XHGzPkg",
  },
} as const;

export const capabilities = [
  "Visual",
  "Design",
  "Develop",
  "Implement",
  "Optimize",
] as const;

export const techStack = [
  { name: "HTML", icon: "/mini-icons/html (1) (1).png" },
  { name: "CSS", icon: "/mini-icons/csssmall.png" },
  { name: "JavaScript", icon: "/mini-icons/js (1) (1).png" },
  { name: "React", icon: "/mini-icons/react (1) (1).png" },
  { name: "Bootstrap", icon: "/mini-icons/boostrap (1) (1).png" },
  { name: "Java", icon: "/mini-icons/java (1) (1).png" },
  { name: "Spring", icon: "/mini-icons/spring (1) (1).png" },
  { name: "Spring Boot", icon: "/mini-icons/spring boot (1).png" },
  { name: "REST API", icon: "/mini-icons/RESTapi (1) (1).png" },
  { name: "MySQL", icon: "/mini-icons/mysql (2) (2).png" },
] as const;

export const education = [
  {
    year: "Now",
    title: "Software Engineering",
    place: "Lithan Academy",
  },
  {
    year: "Now",
    title: "Information Technology",
    place: "University of Cebu - Banilad",
  },
  {
    year: "2022",
    title: "Google Cloud Skills Boost",
    place: "Google Cloud PH",
  },
  {
    year: "2020",
    title: "Science, Technology, Engineering, and Mathematics",
    place: "University of Cebu - Banilad",
  },
] as const;

export const experience = [
  {
    year: "2023 - 2024",
    title: "Software Developer",
    place: "Efunity Pte Ltd",
  },
] as const;

export const projects = [
  {
    slug: "abc-cars",
    title: "ABC Cars Portal",
    description:
      "A used car sales portal where users can register, search by brand, model, manufacturing and registration data, and price range. Users can also post a car for sale and bid on listings.",
    image: "/images/abcars.png",
    tools: ["Spring Boot", "MySQL", "HTML", "CSS", "JavaScript"],
    href: "https://github.com/Jiin-dom/abc-cars-portal.git",
  },
  {
    slug: "kyn",
    title: "Know Your Neighborhood",
    description:
      "Neighborhood platform with social login. Facebook Login API powers authentication through existing OAuth providers.",
    image: "/images/kyn (1).png",
    tools: ["React", "REST API", "OAuth", "Spring Boot", "MySQL", "HTML", "CSS", "JavaScript"],
    href: "https://github.com/Jiin-dom/know-your-neighborhood.git",
  },
  {
    slug: "abc-jobs",
    title: "ABC Jobs",
    description:
      "A jobs and community site where users register, log in, recover passwords, search jobs and people, apply, post threads, and publish job offerings.",
    image: "/images/abcjobs.png",
    tools: ["Spring Boot", "Spring Security", "MySQL", "HTML", "CSS", "JavaScript"],
    href: "https://github.com/Jiin-dom/ABC-Jobs-Portal.git",
  },
  {
    slug: "jumpstart",
    title: "Jumpstart E-commerce",
    description:
      "A mobile e-commerce app focused on customer experience, with cart, loyalty program, and PayPal payment gateway.",
    image: "/images/Jumpstart-Mockup (3).png",
    tools: ["React JS", "REST API", "JWT", "Spring Boot", "MySQL", "PayPal API"],
    href: "https://github.com/Jiin-dom/E-commerce-Mobile-App.git",
  },
  {
    slug: "meals-on-wheels",
    title: "Meals On Wheels",
    description:
      "Charity food delivery for adults unable to cook. Location-aware menus via Distance Matrix API, category filters, rider assignment, donor payments through PayPal, and admin oversight.",
    image: "/images/mealsonwheelhomepage (1).png",
    tools: [
      "React JS",
      "Spring Boot",
      "MySQL",
      "REST API",
      "PayPal API",
      "JWT",
      "Google Distance Matrix API",
    ],
    href: "https://github.com/Jiin-dom/MealsOnWheels-Final.git",
  },
] as const;

export const quote =
  "Driven by a curiosity for technology. Dedicated to transforming ideas into elegant and functional software solutions.";
