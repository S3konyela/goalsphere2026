import { client, isSanityConfigured } from './sanityClient.js';

const fallbackArticles = [
  {
    _id: 'everything-you-need-to-know-football-2026',
    title: 'Everything You Need to Know About Football in 2026',
    publishedAt: '2026-06-19',
    excerpt: 'Football remains the world\'s most popular sport, attracting billions of fans across every continent. From local leagues to international tournaments, the game continues to unite people through passion, competition, and unforgettable moments.',
    slug: { current: 'everything-you-need-to-know-about-football-in-2026' },
    body: `Football remains the world's most popular sport, attracting billions of fans across every continent. From local leagues to international tournaments, the game continues to unite people through passion, competition, and unforgettable moments.

In 2026, football is expected to reach new heights with major tournaments, rising stars, and technological innovations changing the way fans experience the beautiful game. Whether you're a lifelong supporter or new to football, this guide covers everything you need to know.

## What Is Football?
Football, also known as soccer in some countries, is a sport played between two teams of eleven players. The objective is simple: score more goals than the opposing team within 90 minutes.

The sport is governed globally by FIFA, which organizes international competitions and establishes the rules followed around the world.

## Why Football Is So Popular
Football's popularity comes from its simplicity and accessibility. All you need is a ball and an open space to play.

Some reasons football remains the world's favorite sport include:

- Easy to learn
- Exciting competitions
- Global fan base
- Rich history and traditions
- Opportunities for young talent to succeed

## Major Football Competitions in 2026

### FIFA World Cup
The FIFA World Cup is the biggest football tournament in the world. National teams compete for the ultimate prize in international football.

### UEFA Champions League
Europe's top clubs battle throughout the season to determine the best team on the continent.

### Premier League
England's top division remains one of the most watched football leagues globally.

### La Liga
Spain's premier competition featuring some of the world's biggest clubs and players.

### Serie A
Italy's top football league known for tactical excellence and historic clubs.

### Bundesliga
Germany's highest football division, famous for passionate supporters and attacking football.

## Players to Watch in 2026
Football continues to produce incredible young talent. Some of the most exciting players are expected to dominate headlines in 2026 through their performances at club and international level.

Fans should watch emerging stars, established superstars, and rising academy graduates looking to make their mark on the game.

## How Technology Is Changing Football
Modern football relies heavily on technology.

### VAR (Video Assistant Referee)
VAR helps referees make more accurate decisions during matches.

### Goal-Line Technology
This system confirms whether the ball has completely crossed the goal line.

### Performance Analytics
Teams use advanced data and analytics to improve tactics and player performance.

## Football in Africa
African football continues to grow rapidly.

Countries such as South Africa, Morocco, Nigeria, Egypt, and Senegal have produced world-class players and competitive national teams.

The continent's domestic leagues are also improving, attracting more fans and investment each year.

## How to Become a Better Football Fan
To enjoy football even more:

1. Follow your favorite team consistently.
2. Watch different leagues.
3. Learn the rules of the game.
4. Stay updated with football news.
5. Engage with other fans online.

## The Future of Football
The future looks bright for football. Increased global viewership, better technology, and growing youth development programs will continue to expand the sport's reach.

Fans can expect bigger tournaments, more competitive leagues, and exciting new talents emerging every season.

## Conclusion
Football remains more than just a sport—it is a global phenomenon that connects people from different backgrounds and cultures. As 2026 unfolds, fans can look forward to thrilling matches, incredible goals, and unforgettable moments.

Whether you support a local club or an international giant, there has never been a better time to be a football fan.

## Frequently Asked Questions

### What is the biggest football tournament in the world?
The FIFA World Cup is widely regarded as the biggest football tournament globally.

### How long does a football match last?
A standard football match lasts 90 minutes, divided into two halves of 45 minutes each.

### What does VAR stand for?
VAR stands for Video Assistant Referee.

### Which country has won the most FIFA World Cups?
Brazil has won the most FIFA World Cup titles.

### Why is football called the beautiful game?
The phrase refers to football's creativity, skill, excitement, and global appeal.`,
  },
  {
    _id: 'fallback-1',
    title: 'GoalSphere MVP is live',
    publishedAt: '2026-06-18',
    excerpt: 'A launch-ready football platform with fixtures, teams, players, and predictions.',
    slug: { current: 'goalsphere-mvp-live' },
  },
  {
    _id: 'fallback-2',
    title: 'Build your prediction leaderboard',
    publishedAt: '2026-06-17',
    excerpt: 'Fans can submit match forecasts and compete for the top ranking.',
    slug: { current: 'build-your-prediction-leaderboard' },
  },
  {
    _id: 'fallback-3',
    title: 'Follow live World Cup fixtures',
    publishedAt: '2026-06-16',
    excerpt: 'Stay updated with fixtures, scores, and upcoming match schedules.',
    slug: { current: 'follow-live-world-cup-fixtures' },
  },
];

function serializeSanityBody(body) {
  if (!Array.isArray(body)) {
    return body || '';
  }

  return body
    .map((block) => block.children?.map((child) => child.text).join('') || '')
    .filter(Boolean)
    .join('\n\n');
}

export async function fetchArticles() {
  if (!isSanityConfigured) {
    return fallbackArticles.map((item) => ({
      id: item._id,
      title: item.title,
      excerpt: item.excerpt,
      slug: item.slug?.current || '',
      publishedAt: item.publishedAt,
      body: item.body || '',
    }));
  }

  const query = `*[_type == "article"] | order(publishedAt desc) {
    _id,
    title,
    publishedAt,
    excerpt,
    slug,
    body
  }`;

  try {
    const articles = await client.fetch(query);
    return (articles || []).map((item) => ({
      id: item._id,
      title: item.title,
      excerpt: item.excerpt || '',
      slug: item.slug?.current || '',
      publishedAt: item.publishedAt,
      body: serializeSanityBody(item.body),
    }));
  } catch (error) {
    console.error('Sanity fetchArticles failed:', error);
    return fallbackArticles.map((item) => ({
      id: item._id,
      title: item.title,
      excerpt: item.excerpt,
      slug: item.slug?.current || '',
      publishedAt: item.publishedAt,
      body: item.body || '',
    }));
  }
}

export async function fetchArticleBySlug(slug) {
  if (!isSanityConfigured) {
    const article = fallbackArticles.find((item) => item.slug?.current === slug);
    if (!article) {
      throw new Error('Article not found');
    }
    return {
      id: article._id,
      title: article.title,
      excerpt: article.excerpt,
      slug: article.slug?.current || '',
      publishedAt: article.publishedAt,
      body: article.body || '',
    };
  }

  const query = `*[_type == "article" && slug.current == $slug][0]{
    _id,
    title,
    publishedAt,
    excerpt,
    slug,
    body
  }`;
  const params = { slug };

  try {
    const article = await client.fetch(query, params);

    if (!article) {
      throw new Error('Article not found');
    }

    return {
      id: article._id,
      title: article.title,
      excerpt: article.excerpt || '',
      slug: article.slug?.current || '',
      publishedAt: article.publishedAt,
      body: serializeSanityBody(article.body),
    };
  } catch (error) {
    console.error(`Sanity fetchArticleBySlug failed for slug=${slug}:`, error);
    const fallbackArticle = fallbackArticles.find((item) => item.slug?.current === slug);
    if (!fallbackArticle) {
      throw error;
    }
    return {
      id: fallbackArticle._id,
      title: fallbackArticle.title,
      excerpt: fallbackArticle.excerpt,
      slug: fallbackArticle.slug?.current || '',
      publishedAt: fallbackArticle.publishedAt,
      body: fallbackArticle.body || '',
    };
  }
}
