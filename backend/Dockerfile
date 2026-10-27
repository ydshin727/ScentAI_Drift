# 멀티 스테이지 빌드: 1) Gradle로 jar 생성 2) JRE만 있는 가벼운 이미지에서 실행
# build.gradle 의 Java 버전이 21이 아니면 아래 두 이미지의 태그를 맞춰 주세요.
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
# Windows에서 받은 gradlew 의 줄바꿈(CRLF)이 리눅스에서 문제가 되는 것을 막는다.
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew \
 && ./gradlew bootJar -x test --no-daemon \
 && cp "$(ls build/libs/*.jar | grep -v plain | head -n 1)" /app/app.jar

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
