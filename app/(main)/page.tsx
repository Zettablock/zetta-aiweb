import React from 'react'
import Link from 'next/link'
// import { SmileFilled } from '@ant-design/icons'

const HomePage = () => (
  <div style={{ padding: 100, height: '100vh' }}>
    <div className="text-center mb-5">
      <Link href="#" className="logo mr-0">
        Icon
        {/* <SmileFilled style={{ fontSize: 48 }} /> */}
      </Link>
      <p className="mb-0 mt-3 text-disabled">Welcome to the world !</p>
    </div>
    <div></div>
  </div>
)

export default HomePage
