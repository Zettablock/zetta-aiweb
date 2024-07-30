import React from "react";
import { Layout } from "antd";
import { Header, Footer, Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
// see https://medium.com/@fdikmen/fixing-could-not-find-the-module-error-in-nextjs-with-ant-design-3ae2cfe0160d

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  return (
    <Layout>
      <Sider width={200}>Sider</Sider>
      <Layout>
        <Header className="h-40">Header</Header>
        <Content>{children}</Content>
        <Footer>Footer</Footer>
      </Layout>
    </Layout>
  );
}
