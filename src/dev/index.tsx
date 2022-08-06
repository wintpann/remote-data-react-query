import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoryBox } from 'storybox-react';
import 'storybox-react/dist/styles.css';
import { stories } from './stories';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <StoryBox stories={stories} />
  </QueryClientProvider>,
);
