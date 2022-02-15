import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiLocationEnter } from '@mdi/js';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { PLHeader2, PLItem2 } from '@ui/common/element/page/pageListItem2';


const ContainerListItem = (props) => {
  const itemData = props.itemData;
  const linkJSX = (Element) => {
    if (itemData.id)
      return <Link to={`/containers/${itemData.id}`}>{Element}</Link>
    else
      return <div>{Element}</div>
  }
  return linkJSX(
    <li className="list-group-item">
      <div>{itemData.name}</div>
      <div>{itemData.project !== undefined && itemData.project.name ? '프로젝트' + itemData.project.name : ''}</div>
      {itemData.id ? <Icon path={mdiLocationEnter} size={1.5 + 'rem'} /> : ''}
    </li>
  );
}

const ContainerList = () => {
  setSidebarActive(SIDEBAR.CONTAINER);

  // setup state
  const [containerList, setContainerList] = useState();

  const fetchData = () => {
    const dodocoAPI = (new DodoCoAPI());
    /** @type {Promise<Response>} */
    dodocoAPI.get('containers/', true).then((responseBody) => {
      // 409, 410, 422 불가능
      if (200 <= responseBody.code && responseBody.code <= 399) {

        let newContainerList = responseBody.data.containers.map(container => {
          let containerName = container.name;
          let projectName = container.project.name;
          return <Link to={`/containers/${container.uuid}`}>
            <PLItem2 name={containerName} value={projectName} />
          </Link>
        });

        setContainerList(newContainerList);
      } else if (responseBody.code === 404) {
        // 현재 참여 중인 프로젝트가 없음
        setContainerList([]);
      } else {
        throw new DodoCoError(
          '알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.',
          { debugMessage: `responseBody = ${responseBody}`, });
      }
    }).catch((reason) => {
      if (typeof (reason) === 'object' && reason.constructor.name === 'DodoCoError') {
        alert(reason.message);
      } else {
        alert('알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요...');
      }
    });
  }

  useEffect(() => {
    fetchData();
  }, [])

  return <CanvasTemplate title={'컨테이너'}>
    <PageTemplate title={'접근 가능한 컨테이너'}>
      <PLHeader2 name="컨테이너 이름" value="프로젝트 이름" />
      {(containerList != undefined)
        ? (containerList.length > 0) ? containerList : <div>접근 가능한 컨테이너가 없습니다.</div>
        : <div>컨테이너 목록을 불러오는 중입니다...</div>
      }
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ContainerList
};
