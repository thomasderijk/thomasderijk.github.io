import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

interface Button3D {
  mesh: THREE.Mesh;
  route: string;
  label: string;
  baseColor: THREE.Color;
}

const WebGLScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a14, 10, 50);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a14, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xb845ff, 2, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00d4ff, 2, 50);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Create 3D buttons
    const buttons: Button3D[] = [];
    const buttonConfigs = [
      { label: 'PORTFOLIO', route: '/portfolio', color: 0xb845ff, position: [-4, 2, 0] },
      { label: 'SOCIAL', route: '/social', color: 0x00d4ff, position: [4, 2, 0] },
      { label: 'ABOUT', route: '/about', color: 0xff1f8f, position: [-4, -2, 0] },
      { label: 'CONTACT', route: '/contact', color: 0xffd700, position: [4, -2, 0] },
    ];

    buttonConfigs.forEach((config) => {
      const geometry = new THREE.BoxGeometry(3, 1.5, 0.5);
      const material = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.3,
        shininess: 100,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...config.position);
      
      // Add text sprite
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 512;
      canvas.height = 256;
      context.fillStyle = 'white';
      context.font = 'bold 80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(config.label, 256, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(2, 1, 1);
      mesh.add(sprite);

      scene.add(mesh);
      buttons.push({
        mesh,
        route: config.route,
        label: config.label,
        baseColor: new THREE.Color(config.color),
      });
    });

    // Particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x8844ff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredButton: Button3D | null = null;

    // Mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buttons.map(b => b.mesh));

      // Reset all buttons
      buttons.forEach((button) => {
        (button.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3;
        button.mesh.scale.set(1, 1, 1);
      });

      if (intersects.length > 0) {
        const button = buttons.find(b => b.mesh === intersects[0].object);
        if (button) {
          hoveredButton = button;
          (button.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.8;
          button.mesh.scale.set(1.1, 1.1, 1.1);
          document.body.style.cursor = 'pointer';
        }
      } else {
        hoveredButton = null;
        document.body.style.cursor = 'default';
      }
    };

    const onClick = () => {
      if (hoveredButton) {
        navigate(hoveredButton.route);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    // Handle window resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let animationTime = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      animationTime += 0.01;

      // Rotate buttons
      buttons.forEach((button, index) => {
        button.mesh.rotation.y = Math.sin(animationTime + index) * 0.1;
        button.mesh.position.y += Math.sin(animationTime * 2 + index) * 0.001;
      });

      // Rotate particles
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      // Animate lights
      pointLight1.position.x = Math.sin(animationTime) * 10;
      pointLight2.position.x = Math.cos(animationTime) * 10;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [navigate]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0"
      style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #14141e 100%)' }}
    />
  );
};

export default WebGLScene;
