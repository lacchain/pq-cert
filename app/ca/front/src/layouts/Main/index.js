import React from 'react'
import { Layout } from 'antd'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import classNames from 'classnames'
import Breadcrumbs from 'components/cleanui/layout/Breadcrumbs'
import Footer from 'components/cleanui/layout/Footer'

const mapStateToProps = ({ settings }) => ({
  isContentMaxWidth: settings.isContentMaxWidth,
  isAppMaxWidth: settings.isAppMaxWidth,
  isGrayBackground: settings.isGrayBackground,
  isSquaredBorders: settings.isSquaredBorders,
  isCardShadow: settings.isCardShadow,
  isBorderless: settings.isBorderless,
  isTopbarFixed: settings.isTopbarFixed,
  isGrayTopbar: settings.isGrayTopbar,
})

const MainLayout = ({
  children,
  isContentMaxWidth,
  isAppMaxWidth,
  isGrayBackground,
  isSquaredBorders,
  isCardShadow,
  isBorderless,
}) => {
  return (
    <div className={classNames({ cui__layout__grayBackground: isGrayBackground })}>
      <Layout
        className={classNames({
          cui__layout__contentMaxWidth: isContentMaxWidth,
          cui__layout__appMaxWidth: isAppMaxWidth,
          cui__layout__grayBackground: isGrayBackground,
          cui__layout__squaredBorders: isSquaredBorders,
          cui__layout__cardsShadow: isCardShadow,
          cui__layout__borderless: isBorderless,
        })}
      >
        <Layout>
          <Breadcrumbs />
          <Layout.Content style={{ height: '100%', position: 'relative' }}>
            <div className="cui__utils__content">{children}</div>
          </Layout.Content>
          <Layout.Footer>
            <Footer />
          </Layout.Footer>
        </Layout>
      </Layout>
    </div>
  )
}

export default withRouter(connect(mapStateToProps)(MainLayout))
