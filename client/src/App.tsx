import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './admin/AdminLayout';
import Home from './pages/Home';
import KnowledgeBase from './pages/KnowledgeBase';
import KnowledgeCategory from './pages/KnowledgeCategory';
import KnowledgeSubcategory from './pages/KnowledgeSubcategory';
import ArticleView from './pages/ArticleView';
import Drugs from './pages/Drugs';
import DrugDetail from './pages/DrugDetail';
import Diseases from './pages/Diseases';
import DiseaseDetail from './pages/DiseaseDetail';
import Breeds from './pages/Breeds';
import BreedDetail from './pages/BreedDetail';
import Vaccines from './pages/Vaccines';
import VaccineDetail from './pages/VaccineDetail';
import Procedures from './pages/Procedures';
import ProcedureDetail from './pages/ProcedureDetail';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './admin/AdminDashboard';
import AdminCategories from './admin/AdminCategories';
import AdminSubcategories from './admin/AdminSubcategories';
import AdminArticles from './admin/AdminArticles';
import AdminArticleEditor from './admin/AdminArticleEditor';
import AdminDrugs from './admin/AdminDrugs';
import AdminDiseases from './admin/AdminDiseases';
import AdminBreeds from './admin/AdminBreeds';
import AdminVaccines from './admin/AdminVaccines';
import AdminProcedures from './admin/AdminProcedures';
import AdminMedia from './admin/AdminMedia';
import AdminUsers from './admin/AdminUsers';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminSettings from './admin/AdminSettings';
import AdminKnowledge from './admin/AdminKnowledge';
import AdminNotes from './admin/AdminNotes';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/knowledge/:slug" element={<KnowledgeCategory />} />
        <Route path="/knowledge/:categorySlug/:subSlug" element={<KnowledgeSubcategory />} />
        <Route path="/article/:slug" element={<ArticleView />} />
        <Route path="/drugs" element={<Drugs />} />
        <Route path="/drugs/:slug" element={<DrugDetail />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/diseases/:slug" element={<DiseaseDetail />} />
        <Route path="/breeds" element={<Breeds />} />
        <Route path="/breeds/:slug" element={<BreedDetail />} />
        <Route path="/vaccines" element={<Vaccines />} />
        <Route path="/vaccines/:slug" element={<VaccineDetail />} />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/procedures/:slug" element={<ProcedureDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="knowledge" element={<AdminKnowledge />} />
        <Route path="notes" element={<AdminNotes />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="subcategories" element={<AdminSubcategories />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="articles/new" element={<AdminArticleEditor />} />
        <Route path="articles/edit/:id" element={<AdminArticleEditor />} />
        <Route path="drugs" element={<AdminDrugs />} />
        <Route path="diseases" element={<AdminDiseases />} />
        <Route path="breeds" element={<AdminBreeds />} />
        <Route path="vaccines" element={<AdminVaccines />} />
        <Route path="procedures" element={<AdminProcedures />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
