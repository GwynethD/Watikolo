import { AppRouter } from '@/routes/AppRouter';
import { AppDataProvider } from '@/context/AppDataContext';

function App() {
  return (
    <AppDataProvider>
      <AppRouter />
    </AppDataProvider>
  );
}

export default App;
