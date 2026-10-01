import { AppRouter } from '@/routes/AppRouter';
import { AppDataProvider } from '@/context/AppDataContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

function App() {
  return (
    <AppDataProvider>
      <AdminAuthProvider>
        <AppRouter />
      </AdminAuthProvider>
    </AppDataProvider>
  );
}

export default App;
