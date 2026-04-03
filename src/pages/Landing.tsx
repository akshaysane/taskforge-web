import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Landing() {
  return (
    <Layout>
      <div className="text-center">
        <div className="text-5xl mb-4">🏠✨</div>
        <h1 className="text-4xl font-extrabold text-accent mb-2">Happy Habits</h1>
        <p className="text-primary font-semibold mb-8">Learn, grow & earn rewards!</p>

        <div className="flex flex-col gap-3">
          <Link
            to="/register"
            className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="block w-full border-2 border-accent text-accent hover:bg-accent hover:text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
          >
            Parent Login
          </Link>
          <Link
            to="/login/kid"
            className="block w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-6 rounded-full text-lg transition-colors"
          >
            Kid Login
          </Link>
        </div>

        <div className="mt-8 text-3xl flex justify-center gap-2">
          <span>👧</span><span>🧹</span><span>⭐</span><span>🎁</span><span>👦</span>
        </div>
      </div>
    </Layout>
  )
}
