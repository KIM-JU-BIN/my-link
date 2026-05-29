export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  nickname: string;
  bio: string;
  profileImageUrl: string;
  createdAt: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  faviconUrl: string; // 구글 파비콘 API 연동 URL (PRD 사양)
  createdAt: string;   // 정렬 기준이 되는 생성 일시 (PRD 사양)
}

export const dummyUser: UserProfile = {
  id: "google_uid_123456789",
  email: "user@example.com",
  displayName: "Candy Kim",
  username: "김주빈",
  nickname: "candykim",
  bio: "풀스택 개발자이자 향후 DBA를 희망하는 학생",
  profileImageUrl: "/avatar.jpg",
  createdAt: "2026-03-23T10:00:00.000Z"
};

export const dummyLinks: LinkItem[] = [
  {
    id: 'link_instagram',
    title: 'Instagram',
    url: 'https://www.instagram.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=64',
    createdAt: '2026-05-29T12:00:00.000Z',
  },
  {
    id: 'link_youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
    createdAt: '2026-05-29T12:01:00.000Z',
  },
  {
    id: 'link_velog',
    title: 'Velog',
    url: 'https://velog.io',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=velog.io&sz=64',
    createdAt: '2026-05-29T12:02:00.000Z',
  },
  {
    id: 'link_github',
    title: 'GitHub',
    url: 'https://github.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
    createdAt: '2026-05-29T12:03:00.000Z',
  },
  {
    id: 'link_portfolio',
    title: 'Portfolio',
    url: 'https://portfolio.example.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=portfolio.example.com&sz=64',
    createdAt: '2026-05-29T12:04:00.000Z',
  },
];
