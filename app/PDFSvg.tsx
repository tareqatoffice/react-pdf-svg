import { createElement } from 'react';
import { ElementNode, parse, RootNode, TextNode } from 'svg-parser';

const supportedStyleProps = [
	'color',
	'dominantBaseline',
	'fill',
	'fillOpacity',
	'fillRule',
	'opacity',
	'stroke',
	'strokeWidth',
	'strokeOpacity',
	'strokeLinecap',
	'strokeDasharray',
	'transform',
	'textAnchor',
	'visibility',
];

function isElementNode(node: TextNode | ElementNode): node is ElementNode {
	return node.type === 'element';
}

function removeLineBreaks(text?: string | number | boolean) {
	if (typeof text === 'string') {
		return text.replace(/(\r\n|\n|\r)/gm, '');
	}

	return text;
}

// https://dev.to/qausim/convert-html-inline-styles-to-a-style-object-for-react-components-2cbi
const formatStringToCamelCase = (str: string) => {
	const splitted = str.split('-');
	if (splitted.length === 1) return splitted[0];
	return (
		splitted[0] +
		splitted
			.slice(1)
			.map((word) => word[0].toUpperCase() + word.slice(1))
			.join('')
	);
};

export const getStyleObjectFromString = (str: string | null) => {
	const style: any = {};
	if (!str) return {};

	str.split(';').forEach((el) => {
		const [property, value] = el.split(':');
		if (!property) return;
		if (property === 'cursor') return;
		const formattedProperty = formatStringToCamelCase(property.trim());
		if (supportedStyleProps.includes(formattedProperty)) {
			style[formattedProperty] = value.trim();
		}
	});

	return style;
};

function handleRelativePositioning(
	currentPosition: string | number,
	parentPosition?: number
) {
	let position = Number(currentPosition) ?? 0;
	if (parentPosition) {
		position += parentPosition;
	}

	return position;
}

function getParentPosition(pos: number | string | undefined) {
	if (!pos) return 0;
	if (typeof pos === 'string') return Number(pos);
	return pos;
}

function svgToJSXWithRelPositioning(
	node: TextNode | ElementNode | string,
	parentX?: number,
	parentY?: number
): any {
	if (typeof node === 'string') {
		return removeLineBreaks(node);
	}
	if (!isElementNode(node)) {
		return removeLineBreaks(node.value);
	}
	const elementName = node.tagName;
	if (!elementName) {
		console.log('NO TAG NAME: ', node);
		return null;
	}
	let componentProps;
	if (node.tagName === 'desc' || node.tagName === 'defs') return null;

	if (node.properties !== undefined) {
		if (node.tagName === 'text' || node.tagName === 'tspan') {
			componentProps = {
				x: handleRelativePositioning(node.properties.x, parentX),
				y: handleRelativePositioning(node.properties.y, parentY),
				textAnchor: node.properties['text-anchor'],
			};
		} else {
			componentProps = {
				x: handleRelativePositioning(node.properties.x, parentX),
				y: handleRelativePositioning(node.properties.y, parentY),
				...node.properties,
			};
		}

		if (node.properties.style) {
			componentProps = {
				...componentProps,
				style: getStyleObjectFromString(
					node.properties.style as string
				),
			};
		}
	}
	let children;
	if (node.children && node.children.length > 0) {
		children = node.children.map((childNode) =>
			svgToJSXWithRelPositioning(
				childNode,
				getParentPosition(node.properties?.x),
				getParentPosition(node.properties?.y)
			)
		);
	}
	return createElement(elementName.toUpperCase(), componentProps, children);
}

export const createSvgComponent = (svgXml: string) => {
	if (!svgXml || svgXml === '') return null;
	const svg = svgXml.replaceAll('px', 'pt');
	console.log('svg', svg);
	const parsed: RootNode = parse(svg);
	return svgToJSXWithRelPositioning(parsed.children[0], 0);
};
