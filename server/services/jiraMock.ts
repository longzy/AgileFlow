export const getMockData = (boardId: string) => {
  const users = [
    { id: 'u1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'u2', name: 'Sarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'u3', name: 'Mike', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { id: 'u4', name: 'Emma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  ];

  return {
    sprint: {
      id: 's1',
      name: 'Sprint 42 (Mock)',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    issues: [
      { id: 'i1', key: 'PROJ-101', summary: 'Implement Login Page', status: 'todo', estimated: false, assignee: users[0], progress: 0 },
      { id: 'i2', key: 'PROJ-102', summary: 'Database Schema Design', status: 'todo', estimated: false, assignee: users[1], progress: 0 },
      { id: 'i3', key: 'PROJ-103', summary: 'User API Endpoint', status: 'in-progress', estimated: true, storyPoints: 5, assignee: users[2], progress: 50 },
      { id: 'i4', key: 'PROJ-104', summary: 'Landing Page Design', status: 'in-progress', estimated: true, storyPoints: 3, assignee: users[3], progress: 50 },
      { id: 'i5', key: 'PROJ-105', summary: 'Unit Tests for Auth', status: 'done', estimated: true, storyPoints: 2, assignee: users[0], progress: 100 },
    ],
    users
  };
};

export const getMockBoards = () => ({
  boards: [
    { id: '1', name: 'Agile Board', type: 'scrum' },
    { id: '2', name: 'Design Board', type: 'kanban' },
    { id: '3', name: 'Backend Board', type: 'scrum' },
  ],
  isMock: true
});
