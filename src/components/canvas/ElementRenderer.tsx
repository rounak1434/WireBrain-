import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement } from '../../types';
import {
  Server,
  Database,
  Cloud,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { getCachedAssetDataUrl, getAsset } from '../../utils/assets';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdateText?: (id: string, newText: string) => void;
  onSelectImageFile?: (elementId: string) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  onUpdateText,
  onSelectImageFile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textDraft, setTextDraft] = useState(element.label || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (element.src) return element.src;
    if (element.assetId) return getCachedAssetDataUrl(element.assetId);
    return null;
  });

  useEffect(() => {
    if (element.src) {
      setResolvedSrc(element.src);
    } else if (element.assetId) {
      const cached = getCachedAssetDataUrl(element.assetId);
      if (cached) {
        setResolvedSrc(cached);
      } else {
        getAsset(element.assetId).then((asset) => {
          if (asset) setResolvedSrc(asset.data);
        });
      }
    } else {
      setResolvedSrc(null);
    }
  }, [element.src, element.assetId]);

  useEffect(() => {
    setTextDraft(element.label || '');
  }, [element.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    if (onUpdateText && textDraft !== element.label) {
      onUpdateText(element.id, textDraft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTextDraft(element.label || '');
    }
  };

  const {
    type,
    width,
    height,
    label,
    secondaryText,
    fillColor,
    strokeColor,
    strokeWidth,
    cornerRadius = 6,
    fontSize = 14,
    fontWeight = 'normal',
    textAlign = 'left',
    textColor = '#f0f3f8',
    urlBar,
  } = element;

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        width,
        height,
        position: 'relative',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Desktop Browser Frame */}
      {type === 'frame-desktop' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Browser Titlebar */}
          <div
            style={{
              height: 38,
              backgroundColor: '#1b1f28',
              borderBottom: '1px solid #282e3c',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            </div>
            {/* Address Bar */}
            <div
              style={{
                flex: 1,
                maxWidth: 460,
                height: 24,
                backgroundColor: '#12151b',
                border: '1px solid #262c38',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontSize: 11,
                color: '#8b96a8',
              }}
            >
              🔒 {urlBar || 'https://wirebrain.local'}
            </div>
            <div style={{ fontSize: 11, color: '#687384', fontWeight: 500 }}>{label}</div>
          </div>
        </div>
      )}

      {/* 2. Mobile Device Frame */}
      {type === 'frame-mobile' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius || 36,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Island / Speaker Pill */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 86,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#000000',
              zIndex: 5,
            }}
          />
          {/* Bottom Home Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 90,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#505a6a',
              zIndex: 5,
            }}
          />
        </div>
      )}

      {/* 3. Microservice Box */}
      {type === 'service' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Server size={15} color="#3b82f6" />
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
              }}
            />
            {isEditing ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={inlineInputStyle}
              />
            ) : (
              <span style={{ fontSize, fontWeight, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </span>
            )}
          </div>
          {secondaryText && (
            <div style={{ fontSize: 11, color: '#8894a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {secondaryText}
            </div>
          )}
        </div>
      )}

      {/* 4. Database Cylinder */}
      {type === 'cylinder' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            {/* Body */}
            <path
              d={`M 0 16 L 0 ${height - 16} A ${width / 2} 16 0 0 0 ${width} ${height - 16} L ${width} 16 Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Top Cap */}
            <ellipse
              cx={width / 2}
              cy={16}
              rx={width / 2 - strokeWidth / 2}
              ry={15}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Middle Divider Line */}
            <path
              d={`M 0 ${height * 0.45} A ${width / 2} 14 0 0 0 ${width} ${height * 0.45}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4,4"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 0,
              right: 0,
              bottom: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 8px',
            }}
          >
            <Database size={15} color="#38bdf8" style={{ marginBottom: 4 }} />
            {isEditing ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={{ ...inlineInputStyle, textAlign: 'center' }}
              />
            ) : (
              <span style={{ fontSize, fontWeight, color: textColor, lineHeight: 1.2 }}>{label}</span>
            )}
            {secondaryText && (
              <span style={{ fontSize: 10, color: '#8894a6', marginTop: 2 }}>{secondaryText}</span>
            )}
          </div>
        </div>
      )}

      {/* 5. Cloud Resource */}
      {type === 'cloud' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: height / 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        >
          <Cloud size={16} color="#fbbf24" style={{ marginBottom: 4 }} />
          {isEditing ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={{ ...inlineInputStyle, textAlign: 'center' }}
            />
          ) : (
            <span style={{ fontSize, fontWeight, color: textColor }}>{label}</span>
          )}
          {secondaryText && <span style={{ fontSize: 10, color: '#8894a6' }}>{secondaryText}</span>}
        </div>
      )}

      {/* 6. Message Queue / Buffer */}
      {type === 'queue' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            gap: 10,
          }}
        >
          <Layers size={16} color="#c084fc" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {isEditing ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={inlineInputStyle}
              />
            ) : (
              <div style={{ fontSize, fontWeight, color: textColor, whiteSpace: 'nowrap' }}>{label}</div>
            )}
            {secondaryText && <div style={{ fontSize: 10, color: '#8894a6' }}>{secondaryText}</div>}
          </div>
        </div>
      )}

      {/* 7. Decision Diamond */}
      {type === 'diamond' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <polygon
              points={`${width / 2},${strokeWidth / 2} ${width - strokeWidth / 2},${height / 2} ${width / 2},${height - strokeWidth / 2} ${strokeWidth / 2},${height / 2}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 12px',
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={{ ...inlineInputStyle, textAlign: 'center' }}
              />
            ) : (
              <span style={{ fontSize, fontWeight, color: textColor }}>{label}</span>
            )}
          </div>
        </div>
      )}

      {/* 8. Ellipse / Oval */}
      {type === 'ellipse' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 8,
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={{ ...inlineInputStyle, textAlign: 'center' }}
            />
          ) : (
            <span style={{ fontSize, fontWeight, color: textColor }}>{label}</span>
          )}
        </div>
      )}

      {/* 9. Button */}
      {type === 'button' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={{ ...inlineInputStyle, textAlign: 'center' }}
            />
          ) : (
            <span style={{ fontSize, fontWeight, color: textColor }}>{label}</span>
          )}
        </div>
      )}

      {/* 10. Input Box */}
      {type === 'input' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            color: textColor,
            fontSize,
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={inlineInputStyle}
            />
          ) : (
            <span style={{ opacity: 0.7 }}>{label}</span>
          )}
        </div>
      )}

      {/* 11. Image Element */}
      {type === 'image' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor || '#0f1219',
            border: `${strokeWidth}px solid ${strokeColor || '#232938'}`,
            borderRadius: cornerRadius,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {resolvedSrc ? (
            <>
              <img
                src={resolvedSrc}
                alt={label || 'Canvas image'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: element.imageFit || 'cover',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
              {label && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    fontSize: 10,
                    color: '#f8fafc',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label}
                </div>
              )}
            </>
          ) : (
            <>
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0, opacity: 0.2 }}
              >
                <line x1="0" y1="0" x2={width} y2={height} stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1={height} x2={width} y2="0" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" />
              </svg>
              <div
                onClick={(e) => {
                  if (onSelectImageFile) {
                    e.stopPropagation();
                    onSelectImageFile(element.id);
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: 8,
                  cursor: onSelectImageFile ? 'pointer' : 'default',
                }}
              >
                <ImageIcon size={22} color="#717d91" />
                <span
                  style={{
                    fontSize: 11,
                    color: '#8b97a8',
                    fontWeight: 500,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {label || 'Choose Image'}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    color: '#525e70',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  Drop or Click
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 12. Text element */}
      {type === 'text' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {isEditing ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              style={{
                ...inlineInputStyle,
                width: '100%',
                height: '100%',
                resize: 'none',
                textAlign,
                fontSize,
                fontWeight,
              }}
            />
          ) : (
            <span
              style={{
                fontSize,
                fontWeight,
                color: textColor,
                textAlign,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.35,
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}

      {/* 13. Rectangle / Card Container */}
      {type === 'rectangle' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: cornerRadius,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          {label && (
            <div style={{ marginBottom: secondaryText ? 6 : 0, textAlign }}>
              {isEditing ? (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  style={{ ...inlineInputStyle, textAlign }}
                />
              ) : (
                <span style={{ fontSize, fontWeight, color: textColor }}>{label}</span>
              )}
            </div>
          )}
          {secondaryText && (
            <div
              style={{
                fontSize: 12,
                color: '#8b96a8',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
                textAlign,
              }}
            >
              {secondaryText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const inlineInputStyle: React.CSSProperties = {
  backgroundColor: '#12151b',
  border: '1px solid #3b82f6',
  borderRadius: 4,
  padding: '2px 6px',
  color: '#ffffff',
  outline: 'none',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  width: '90%',
};
