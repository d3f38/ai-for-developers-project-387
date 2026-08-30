module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/"],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:accessibility": ["warn", { minScore: 0.7 }],
        "categories:best-practices": ["warn", { minScore: 0.7 }],
        "categories:seo": ["warn", { minScore: 0.7 }],
      },
    },
  },
};
