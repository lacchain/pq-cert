import React from 'react'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'
import { Menu, Dropdown, Avatar } from 'antd'
import { history } from 'index'
import styles from './style.module.scss'

const mapStateToProps = ({ user }) => ({ user })

const ProfileMenu = ({ dispatch, user }) => {

  const logout = e => {
    e.preventDefault()
    dispatch({
      type: 'user/LOGOUT',
    })
    history.push('/auth/login')
  }

  const menu = (
    <Menu selectable={false}>
      <Menu.Item>
        <div>
          <strong>Address: </strong> {user.address}
        </div>
      </Menu.Item>
      <Menu.Item>
        <a href="#" onClick={logout}>
          <i className="fe fe-log-out mr-2" />
          <FormattedMessage id="topBar.profileMenu.logout" />
        </a>
      </Menu.Item>
    </Menu>
  )
  if( true )
    return <></>;

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <div className={styles.dropdown}>
        <Avatar
          className={styles.avatar}
          shape="circle"
          size="large"
          style={{marginRight: '10px'}}
          icon={
            <img alt="Network" src="/resources/images/chains/lacchain.png" />
          }
        />
        {user.username}
      </div>
    </Dropdown>
  )
}

export default connect(mapStateToProps)(ProfileMenu)
