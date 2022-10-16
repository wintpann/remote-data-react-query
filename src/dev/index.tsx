import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  QueryClient as QueryClientV3,
  QueryClientProvider as QueryClientProviderV3,
} from 'react-query';
import { StoryBox } from 'storybox-react';
import 'storybox-react/dist/styles.css';
import { stories } from './stories';

const queryClient = new QueryClient();
const queryClientV3 = new QueryClientV3();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <QueryClientProviderV3 client={queryClientV3}>
      <StoryBox stories={stories} />
    </QueryClientProviderV3>
  </QueryClientProvider>,
);
