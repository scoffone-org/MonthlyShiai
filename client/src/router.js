import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import MatchEntryView from './views/MatchEntryView.vue';
import ResultsView from './views/ResultsView.vue';
import RankingsView from './views/RankingsView.vue';

export const pages = [
  { path: '/entry', name: 'entry', component: MatchEntryView, title: 'Enter match results', description: 'Record the outcome of each match as it finishes.' },
  { path: '/results', name: 'results', component: ResultsView, title: 'Match results', description: 'Review every recorded match, filtered by date.' },
  { path: '/rankings', name: 'rankings', component: RankingsView, title: 'Scores and rankings', description: 'Total points, wins and ties per competitor.' },
];

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    ...pages.map(({ path, name, component }) => ({ path, name, component })),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
