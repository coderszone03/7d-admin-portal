import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/LoginPage'
import OverviewPage from '../pages/OverviewPage'
import ClientsPage from '../pages/ClientsPage'
import AboutPage from '../pages/AboutPage'
import PortfolioProjectsPage from '../pages/portfolio/PortfolioProjectsPage'
import PortfolioFeaturesPage from '../pages/portfolio/PortfolioFeaturesPage'
import ServicesPage from '../pages/ServicesPage'
import BlogCategoriesPage from '../pages/blog/BlogCategoriesPage'
import BlogPostsPage from '../pages/blog/BlogPostsPage'
import EnquiryPage from '../pages/EnquiryPage'
import CareersPage from '../pages/CareersPage'
import ContactSettingsPage from '../pages/settings/ContactSettingsPage'
import MailSettingsPage from '../pages/settings/MailSettingsPage'
import SettingsPage from '../pages/SettingsPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="portfolio/projects" element={<PortfolioProjectsPage />} />
        <Route path="portfolio/features" element={<PortfolioFeaturesPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="blog/categories" element={<BlogCategoriesPage />} />
        <Route path="blog/posts" element={<BlogPostsPage />} />
        <Route path="enquiry" element={<EnquiryPage />} />
        <Route path="careers" element={<CareersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/contact" element={<ContactSettingsPage />} />
        <Route path="settings/mail" element={<MailSettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
