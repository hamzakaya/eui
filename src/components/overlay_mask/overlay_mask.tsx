/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/**
 * NOTE: We can't test this component because Enzyme doesn't support rendering
 * into portals.
 */

import React, {
  FunctionComponent,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { CommonProps, keysOf } from '../common';

export interface EuiOverlayMaskInterface {
  /**
   * Function that applies to clicking the mask itself and not the children
   */
  onClick?: () => void;
  /**
   * ReactNode to render as this component's content
   */
  children?: ReactNode;
  /**
   * Should the mask visually sit above or below the EuiHeader (controlled by z-index)
   */
  headerZindexLocation?: 'above' | 'below';
}

export type EuiOverlayMaskProps = CommonProps &
  Omit<
    Partial<Record<keyof HTMLAttributes<HTMLDivElement>, string>>,
    keyof EuiOverlayMaskInterface
  > &
  EuiOverlayMaskInterface;

export const EuiOverlayMask: FunctionComponent<EuiOverlayMaskProps> = ({
  className,
  children,
  onClick,
  headerZindexLocation = 'above',
  ...rest
}) => {
  const overlayMaskNode = useRef<HTMLDivElement>();
  const [isPortalTargetReady, setIsPortalTargetReady] = useState(false);

  useEffect(() => {
    document.body.classList.add('euiBody-hasOverlayMask');

    return () => {
      document.body.classList.remove('euiBody-hasOverlayMask');
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      overlayMaskNode.current = document.createElement('div');
    }
  }, []);

  useEffect(() => {
    const portalTarget = overlayMaskNode.current;

    if (portalTarget) {
      document.body.appendChild(portalTarget);
    }

    setIsPortalTargetReady(true);

    return () => {
      if (portalTarget) {
        document.body.removeChild(portalTarget);
      }
    };
  }, []);

  useEffect(() => {
    if (!overlayMaskNode.current) return;
    keysOf(rest).forEach((key) => {
      if (typeof rest[key] !== 'string') {
        throw new Error(
          `Unhandled property type. EuiOverlayMask property ${key} is not a string.`
        );
      }
      if (overlayMaskNode.current) {
        overlayMaskNode.current.setAttribute(key, rest[key]!);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!overlayMaskNode.current) return;
    overlayMaskNode.current.className = classNames(
      'euiOverlayMask',
      `euiOverlayMask--${headerZindexLocation}Header`,
      className
    );
  }, [className, headerZindexLocation]);

  useEffect(() => {
    const portalTarget = overlayMaskNode.current;
    if (!portalTarget || !onClick) return;

    const listener = (e: Event) => {
      if (e.target === portalTarget) {
        onClick();
      }
    };
    portalTarget.addEventListener('click', listener);

    return () => {
      portalTarget.removeEventListener('click', listener);
    };
  }, [onClick]);

  return isPortalTargetReady ? (
    <>{createPortal(children, overlayMaskNode.current!)}</>
  ) : null;
};
